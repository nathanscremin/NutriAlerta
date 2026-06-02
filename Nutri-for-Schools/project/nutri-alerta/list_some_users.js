const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email, nome')
    .limit(10);
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Sample users:', data);
  }
}

run();
