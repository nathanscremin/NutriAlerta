const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseAnonKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Authenticating...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'nutrialerta@gmail.com',
    password: '#Pangam123@'
  });
  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }
  console.log('Authenticated successfully!');

  const tables = ['escolas', 'registros_saude', 'pacientes', 'dados_nutricionais', 'alunos', 'triagens', 'avaliacoes'];
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      if (error) {
        console.log(`Table ${table}: error - ${error.message} (code: ${error.code})`);
      } else {
        console.log(`Table ${table}: SUCCESS! Row sample:`, data);
      }
    } catch (e) {
      console.log(`Table ${table}: throw - ${e.message}`);
    }
  }
}

check();
