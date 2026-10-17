const localtunnel = require('localtunnel');

async function connect() {
  try {
    const tunnel = await localtunnel({
      port: 8000,
      local_host: '127.0.0.1'
    });
    console.log('TUNNEL_LIVE_URL:' + tunnel.url);
    
    tunnel.on('close', () => {
      console.log('Tunnel closed, reconnecting in 3s...');
      setTimeout(connect, 3000);
    });
    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Tunnel connect failed:', err);
    setTimeout(connect, 3000);
  }
}

connect();

// Keep event loop alive indefinitely
setInterval(() => {}, 60000);
