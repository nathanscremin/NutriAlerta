const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function run() {
  const email = 'em_elpidio_mina@nutrialerta.com';
  const password = 'elpidiomina@nutrialerta';
  
  console.log(`Attempting login for ${email} with password ${password}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('❌ Login failed:', error.message, error);
  } else {
    console.log('✅ Login succeeded!', data);
  }
}

run();
