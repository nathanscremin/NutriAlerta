const https = require('https');

const options = {
  hostname: 'peqvaslchaxrewhtxltc.supabase.co',
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Raw response:', data);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});
req.end();
