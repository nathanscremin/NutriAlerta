const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email, nome')
    .eq('email', 'em_elpidio_mina@nutrialerta.com');
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('User found:', data);
  }
}

run();
