const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseAnonKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

// List of schools and their generated credentials from verify_tables_and_rls
const testUsers = [
  { email: 'ee_jose_fernandes_professor@nutrialerta.com', pass: 'josefernandesprofessor@nutrialerta', id: 32 },
  { email: 'ee_marciano_de_toledo_piza_professor@nutrialerta.com', pass: 'marcianodetoledopizaprofessor@nutrialerta', id: 33 },
  { email: 'ee_michel_antonio_alem_professor@nutrialerta.com', pass: 'michelantonioalemprofessor@nutrialerta', id: 34 },
  { email: 'ee_barao_de_piracicaba@nutrialerta.com', pass: 'baraodepiracicaba@nutrialerta', id: 22 }
];

async function check() {
  for (const user of testUsers) {
    console.log(`Logging in as school user ${user.email}...`);
    // Create fresh client for each user to avoid caching headers
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: user.pass
    });
    
    if (authError) {
      console.log(`❌ Auth failed for ${user.email}: ${authError.message}`);
      continue;
    }
    
    console.log(`✅ Auth success! Fetching health records for school_id = ${user.id}...`);
    const { data, error } = await supabaseClient
      .from('registros_saude')
      .select('*');
      
    if (error) {
      console.log(`❌ Fetch failed: ${error.message}`);
    } else {
      console.log(`🎉 Success! Found ${data.length} records.`);
      if (data.length > 0) {
        console.log('Sample record:', data[0]);
      }
    }
  }
}

check();
