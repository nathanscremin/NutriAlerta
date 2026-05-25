const { createClient } = require('@supabase/supabase-js');

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
  
  // Try selecting from pg_policies (exposed or not)
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*');
    
  if (error) {
    console.log('pg_policies error:', error.message);
  } else {
    console.log('pg_policies rules:', data);
  }
}

run();
