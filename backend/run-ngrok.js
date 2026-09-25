require('dotenv').config();
const ngrok = require('@ngrok/ngrok');

const PORT = process.env.PORT || 5000;
const authtoken = process.env.NGROK_AUTHTOKEN;
const domain = process.env.NGROK_DOMAIN || null;

(async function () {
  console.log('----------------------------------------------------');
  console.log('Starting Ngrok Tunnel for Local Port ' + PORT + '...');
  if (!authtoken) {
    console.log('Tip: If you have an ngrok account, add NGROK_AUTHTOKEN to your .env file.');
  }

  try {
    const opts = {
      addr: PORT,
      authtoken: authtoken || undefined
    };
    if (domain) {
      opts.domain = domain;
      console.log('Custom Domain: ' + domain);
    }

    const listener = await ngrok.connect(opts);
    const url = typeof listener === 'string' ? listener : (listener.url ? listener.url() : String(listener));

    console.log('====================================================');
    console.log('NGROK TUNNEL ONLINE!');
    console.log('Public URL: ' + url);
    console.log('Forwarding To: http://localhost:' + PORT);
    console.log('Meta/WAHA Webhook: ' + url + '/api/webhooks/whatsapp');
    console.log('====================================================');
    console.log('Press Ctrl+C to stop the tunnel.');

    process.stdin.resume();
  } catch (err) {
    console.error('Failed to start ngrok tunnel:', err.message);
    if (err.message.includes('authtoken') || err.message.includes('authentication failed')) {
      console.error('Please visit https://dashboard.ngrok.com/get-started/your-authtoken and put NGROK_AUTHTOKEN in backend/.env');
    }
    process.exit(1);
  }
})();
