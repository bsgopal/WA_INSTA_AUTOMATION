require('dotenv').config();
const { spawn } = require('child_process');

const PORT = process.env.PORT || 5000;
console.log(`\x1b[36m⚡ [Cloudflare Tunnel] Starting Cloudflare Tunnel for Local Port ${PORT}...\x1b[0m`);
console.log(`\x1b[33mℹ️  Cloudflare Tunnel bypasses WhatsApp/ISP domain blocking completely.\x1b[0m\n`);

const cloudflared = spawn('cloudflared', ['tunnel', '--config', '', '--url', `http://127.0.0.1:${PORT}`]);

let detectedUrl = null;

cloudflared.stderr.on('data', (data) => {
  const text = data.toString();
  if (!detectedUrl) {
    const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/i);
    if (match) {
      detectedUrl = match[0];
      console.log('\n\x1b[32m========================================================================\x1b[0m');
      console.log('\x1b[32m  ✅ CLOUDFLARE TUNNEL ONLINE (WHATSAPP UNBLOCKED)\x1b[0m');
      console.log(`\x1b[32m  🌐 Public HTTPS URL: ${detectedUrl}\x1b[0m`);
      console.log(`\x1b[36m  🔗 WhatsApp Webhook: ${detectedUrl}/api/webhooks/whatsapp\x1b[0m`);
      console.log(`\x1b[35m  🔗 Meta Cloud API Verify URL: ${detectedUrl}/api/webhooks/whatsapp\x1b[0m`);
      console.log('\x1b[32m========================================================================\x1b[0m\n');
    }
  }
});

cloudflared.stdout.on('data', (data) => {
  const text = data.toString().trim();
  if (text) console.log(`[cloudflared] ${text}`);
});

cloudflared.on('error', (err) => {
  console.error('\x1b[31m❌ [Cloudflare Tunnel] Process Error:\x1b[0m', err.message);
  if (err.code === 'ENOENT') {
    console.error('cloudflared is not installed or not in PATH.');
  }
});

cloudflared.on('close', (code) => {
  console.log(`\x1b[33m⚡ [Cloudflare Tunnel] Process exited with code ${code}\x1b[0m`);
});

process.on('SIGINT', () => {
  console.log('\nStopping Cloudflare Tunnel...');
  cloudflared.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  cloudflared.kill('SIGTERM');
  process.exit(0);
});
