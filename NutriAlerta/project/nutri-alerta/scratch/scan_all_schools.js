const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseAnonKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function normalizeText(text) {
  return text.normalize("NFD")
             .replace(/[\u0300-\u036f]/g, "")
             .replace(/ª/g, "a")
             .replace(/º/g, "o");
}

async function run() {
  console.log('Authenticating as superadmin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nutrialerta@gmail.com',
    password: '#Pangam123@'
  });
  
  if (authError) {
    console.error('Superadmin auth failed:', authError.message);
    return;
  }
  
  console.log('Superadmin authenticated. Fetching all users...');
  const { data: users, error: usersErr } = await supabase.from('usuarios').select('*');
  if (usersErr) {
    console.error('Failed to fetch users:', usersErr.message);
    return;
  }
  
  console.log(`Found ${users.length} users in database. Scanning...`);
  
  for (const u of users) {
    if (u.email === 'nutrialerta@gmail.com') continue;
    
    // Generate password deterministically
    const schoolName = u.nome;
    const normalizedName = normalizeText(schoolName).toLowerCase();
    
    let pwdBase = normalizedName;
    pwdBase = pwdBase.replace(/^e\.e\.\s*/, '');
    pwdBase = pwdBase.replace(/^e\.m\.\s*/, '');
    pwdBase = pwdBase.replace(/[^a-z0-9]/g, '');
    const password = `${pwdBase}@nutrialerta`;
    
    // Create isolated client
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { error: userAuthError } = await userClient.auth.signInWithPassword({
      email: u.email,
      password: password
    });
    
    if (userAuthError) {
      // Try alternative password generation (sometimes raw school name is different)
      console.log(`[!] Auth failed for ${u.email}`);
      continue;
    }
    
    const { data: records, error: recordsErr } = await userClient
      .from('registros_saude')
      .select('*');
      
    if (recordsErr) {
      console.error(`Error querying ${u.email}:`, recordsErr.message);
    } else if (records && records.length > 0) {
      console.log(`🎉 FOUND DATA! School: ${u.nome} (ID: ${u.escola_id}, Email: ${u.email}) - Records: ${records.length}`);
      console.log('Sample record:', records[0]);
    }
  }
  console.log('Scan complete.');
}

run();
