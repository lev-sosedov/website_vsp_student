import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const required = [
  'og:type', 'og:url', 'og:title', 'og:description', 'og:image',
  'og:image:secure_url', 'og:image:width', 'og:image:height',
  'twitter:card', 'twitter:image',
];
for (const field of required) {
  if (!html.includes(field)) throw new Error(`Missing social metadata: ${field}`);
}
if (html.includes('Vite + React + TS')) throw new Error('Template title remains');
const png = fs.readFileSync('public/social-preview.png');
if (png.readUInt32BE(0) !== 0x89504e47 || png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
  throw new Error('social-preview.png must be a 1200x630 PNG');
}
console.log('production preview check passed');
