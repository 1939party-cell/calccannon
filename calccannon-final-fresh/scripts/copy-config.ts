import fs from 'node:fs';
fs.mkdirSync('./public', { recursive: true });
fs.copyFileSync('./config/site.json', './public/site.json');
