const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const adminEmail = 'nutrialerta@gmail.com';
  const adminPassword = '#Pangam123@';
  console.log(`Logging in as ${adminEmail}...`);
  await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword
  });

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, email, nome')
    .ilike('email', '%elpidio%');
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Users found:', data);
  }
}

run();
