import http from 'http';

function checkUrl(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', (err) => reject(err));
  });
}

async function run() {
  try {
    const health = await checkUrl('http://127.0.0.1:5001/api/health');
    console.log('Health API Response:', health);

    const config = await checkUrl('http://127.0.0.1:5001/api/config');
    console.log('Config API Response:', config);
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

run();
