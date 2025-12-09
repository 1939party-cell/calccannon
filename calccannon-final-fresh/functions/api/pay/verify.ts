function json(body:any, init:ResponseInit = {}) {
  return new Response(JSON.stringify(body), { ...init, headers: { "content-type": "application/json; charset=utf-8" } });
}
function b64url(bytes:Uint8Array){
  return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
async function signJWT(payload:any, secret:string, ttlSec:number){
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now()/1000) + ttlSec;
  const enc = (o:any)=> new TextEncoder().encode(JSON.stringify(o));
  const h = b64url(enc(header));
  const p = b64url(enc({ ...payload, exp }));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${h}.${p}`));
  const s = b64url(new Uint8Array(sig));
  return `${h}.${p}.${s}`;
}
async function rpc(endpoint:string, method:string, params:any[]){
  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type":"application/json" },
    body: JSON.stringify({ jsonrpc:"2.0", id:1, method, params })
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}
export const onRequestGet: PagesFunction<{
  PAYMENTS: KVNamespace,
  JWT_SECRET: string,
  RPC_SOLANA: string,
  SITE_CONFIG: string,
}> = async ({ request, env }) => {
  const url = new URL(request.url);
  const sid  = url.searchParams.get('sid') || '';
  const amt  = Number(url.searchParams.get('amt') || '0');
  const mint = url.searchParams.get('mint') || 'USDC';
  if (!sid || !amt || !mint) return json({ error: 'bad_request' }, { status: 400 });
  const existing = await env.PAYMENTS.get(`receipt:${sid}`, { type: "json" }) as any;
  if (existing) {
    const jwt = await signJWT({ sid, grants:["csv","batch"] }, env.JWT_SECRET, 60*60*12);
    return json({ jwt });
  }
  const cfg = JSON.parse(env.SITE_CONFIG || "{}");
  const address = cfg?.wallet?.solanaAddress;
  if (!address) return json({ error: 'config_missing' }, { status: 500 });
  const memo = `calc-${sid}`;
  try {
    const sigs = await rpc(env.RPC_SOLANA, "getSignaturesForAddress", [ address, { limit: 20 } ]);
    for (const s of sigs) {
      const tx = await rpc(env.RPC_SOLANA, "getTransaction", [ s.signature, { "maxSupportedTransactionVersion": 0 } ]);
      if (!tx?.meta) continue;
      const text = JSON.stringify(tx);
      if (!text.includes(memo)) continue;
      let ok = false;
      if (mint === "SOL") {
        const keys = tx.transaction.message.accountKeys.map((k:any)=> (typeof k === 'string' ? k : k.pubkey));
        const idx = keys.indexOf(address);
        if (idx >= 0) {
          const pre  = tx.meta.preBalances[idx] || 0;
          const post = tx.meta.postBalances[idx] || 0;
          const deltaLamports = post - pre;
          const lamports = Math.round(amt * 1e9);
          ok = deltaLamports >= lamports;
        }
      } else {
        const pre = (tx.meta.preTokenBalances || []).find((b:any)=> b.owner===address && b.mint===cfg.wallet.mints.USDC);
        const post= (tx.meta.postTokenBalances|| []).find((b:any)=> b.owner===address && b.mint===cfg.wallet.mints.USDC);
        if (post) {
          const preUi  = pre ? Number(pre.uiTokenAmount.uiAmountString) : 0;
          const postUi = Number(post.uiTokenAmount.uiAmountString);
          ok = (postUi - preUi) >= amt;
        }
      }
      if (!ok) continue;
      await env.PAYMENTS.put(`receipt:${sid}`, JSON.stringify({ signature: s.signature, amount: amt, mint, ts: Date.now() }), { expirationTtl: 60*60*24*7 });
      const jwt = await signJWT({ sid, grants:["csv","batch"] }, env.JWT_SECRET, 60*60*12);
      return json({ jwt });
    }
    return json({ pending: true });
  } catch (e:any) {
    return json({ error: 'rpc_error', message: e.message });
  }
};
