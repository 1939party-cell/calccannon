export async function setupProUnlock() {
  const el = document.getElementById('pro');
  if (!el) return;
  const cfg = await fetch('/site.json').then(r=>r.json());
  const sid = crypto.randomUUID();
  const memo = `calc-${sid}`;
  const price = cfg.pricing.proUSD;
  const cashUrl = "https://cash.app/maddabbs20";
  el.innerHTML = `
    <section>
      <h3>Pro features</h3>
      <p>Batch runs & CSV export</p>
      <p><b>Option A:</b> Pay <b>${price} USDC</b> (or SOL eqv.) to:</p>
      <code>${cfg.wallet.solanaAddress}</code>
      <p>Memo (required): <code>${memo}</code></p>
      <button id="verify">I've paid — Verify</button>
      <hr/>
      <p><b>Option B:</b> Tip via Cash App (supports you, doesn't unlock Pro):</p>
      <p><a href="${cashUrl}" target="_blank" rel="noopener">cash.app/maddabbs20</a></p>
      <div id="pro-status" style="margin-top:.5rem;"></div>
    </section>
  `;
  document.getElementById('verify')?.addEventListener('click', async ()=>{
    const status = document.getElementById('pro-status');
    status.textContent = 'Checking payment...';
    const r = await fetch(`/api/pay/verify?sid=${sid}&amt=${price}&mint=USDC`);
    const j = await r.json();
    if (j.jwt) {
      sessionStorage.setItem('pro_jwt', j.jwt);
      status.textContent = 'Unlocked!';
      document.documentElement.classList.add('pro');
    } else {
      status.textContent = 'Payment not found yet. Try again in 30–60s.';
    }
  });
}
