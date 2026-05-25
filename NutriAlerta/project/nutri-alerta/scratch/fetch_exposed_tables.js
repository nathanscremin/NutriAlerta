const https = require('https');

const options = {
  hostname: 'peqvaslchaxrewhtxltc.supabase.co',
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33',
    'Authorization': 'Bearer sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Exposed Tables/Definitions:');
      if (parsed.definitions) {
        console.log(Object.keys(parsed.definitions));
      } else {
        console.log('No definitions found, keys:', Object.keys(parsed));
      }
    } catch (e) {
      console.log('Failed to parse response:', e.message);
      console.log(data.substring(0, 1000));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});
req.end();
