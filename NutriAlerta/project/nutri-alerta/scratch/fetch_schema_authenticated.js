const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseAnonKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('Authenticating...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nutrialerta@gmail.com',
    password: '#Pangam123@'
  });
  
  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }
  
  const token = authData.session.access_token;
  console.log('Authenticated successfully! Token acquired.');

  const options = {
    hostname: 'peqvaslchaxrewhtxltc.supabase.co',
    path: '/rest/v1/',
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('PostgREST OpenAPI Response Status:', res.statusCode);
      try {
        const schema = JSON.parse(data);
        console.log('Exposed endpoints/paths:');
        console.log(Object.keys(schema.paths || {}));
        console.log('Exposed definitions:');
        console.log(Object.keys(schema.definitions || {}));
      } catch (err) {
        console.error('Failed to parse schema:', err.message);
        console.log(data.substring(0, 1000));
      }
    });
  });

  req.on('error', (e) => {
    console.error('Request error:', e);
  });
  req.end();
}

run();
