const fs = require('fs');
const http = require('https');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co/rest/v1/';
const apiKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const options = {
  headers: {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`
  }
};

http.get(supabaseUrl, options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const spec = JSON.parse(data);
      console.log('API Title:', spec.info.title);
      console.log('Tables/Paths found:', Object.keys(spec.paths));
      
      // Let's print details about the 'escolas' and 'usuarios' definitions
      if (spec.definitions) {
        console.log('\n--- escolas schema ---');
        console.log(JSON.stringify(spec.definitions.escolas, null, 2));
        
        console.log('\n--- usuarios schema ---');
        console.log(JSON.stringify(spec.definitions.usuarios, null, 2));
        
        console.log('\n--- registros_saude schema ---');
        console.log(JSON.stringify(spec.definitions.registros_saude, null, 2));
      } else {
        console.log('No definitions field found in OpenAPI spec.');
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
      console.log('Raw output:', data.substring(0, 1000));
    }
  });
}).on('error', (err) => {
  console.error('Error fetching spec:', err.message);
});
