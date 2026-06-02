const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  console.log('--- Checking Supabase tables and RLS ---');
  
  // 1. Sign in as superadmin
  const email = 'nutrialerta@gmail.com';
  const password = '#Pangam123@';
  console.log(`Signing in as ${email}...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) {
    console.error('❌ Sign in failed:', authError.message);
    return;
  }
  
  console.log('✅ Sign in successful! User ID:', authData.session.user.id);
  console.log('User Metadata:', authData.session.user.user_metadata);
  console.log('App Metadata:', authData.session.user.app_metadata);
  console.log('Access Token:', authData.session.access_token);
  console.log('User Metadata:', authData.session.user.user_metadata);
  console.log('App Metadata:', authData.session.user.app_metadata);
  
  // 2. Query 'usuarios'
  console.log('\nChecking "usuarios" table...');
  const { data: users, error: usersErr } = await supabase.from('usuarios').select('*');
  if (usersErr) {
    console.error('❌ Failed fetching from "usuarios":', usersErr.message);
  } else {
    console.log('✅ Succeeded fetching from "usuarios". Rows count:', users.length);
    console.log('Sample data:', users);
  }

  // 3. Query 'escolas'
  console.log('\nChecking "escolas" table...');
  const { data: schools, error: schoolsErr } = await supabase.from('escolas').select('*');
  if (schoolsErr) {
    console.error('❌ Failed fetching from "escolas":', schoolsErr.message);
  } else {
    console.log('✅ Succeeded fetching from "escolas". Rows count:', schools.length);
  }

  // 4. Try inserting a school
  console.log('\nTesting inserting a school...');
  const testSchoolName = 'Escola Teste ' + Math.floor(Math.random() * 1000);
  const { data: insSchool, error: insSchoolErr } = await supabase
    .from('escolas')
    .insert([{ nome: testSchoolName, bairro: 'Centro' }])
    .select();
    
  if (insSchoolErr) {
    console.error('❌ School insertion failed:', insSchoolErr.message);
  } else {
    console.log('✅ School insertion succeeded!', insSchool[0]);
    
    // 5. Try inserting a health record linked to that school
    console.log('\nTesting inserting health record...');
    const { data: insRecord, error: insRecordErr } = await supabase
      .from('registros_saude')
      .insert([{
        escola_id: insSchool[0].id,
        genero: 'M',
        idade: 10,
        peso: 32.5,
        altura: 1.30,
        data_coleta: new Date().toISOString()
      }])
      .select();
      
    if (insRecordErr) {
      console.error('❌ Health record insertion failed:', insRecordErr.message);
    } else {
      console.log('✅ Health record insertion succeeded!', insRecord[0]);
      
      // Cleanup record
      const { error: delRecErr } = await supabase
        .from('registros_saude')
        .delete()
        .eq('id', insRecord[0].id);
      console.log('Health record cleanup status:', delRecErr ? delRecErr.message : 'Cleaned up successfully');
    }

    // Cleanup school
    const { error: delSchoolErr } = await supabase
      .from('escolas')
      .delete()
      .eq('id', insSchool[0].id);
    console.log('School cleanup status:', delSchoolErr ? delSchoolErr.message : 'Cleaned up successfully');
  }
}

checkAll();
