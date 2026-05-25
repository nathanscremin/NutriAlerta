const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://peqvaslchaxrewhtxltc.supabase.co';
const supabaseAnonKey = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
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

  // Select a single row to inspect columns or query pg_columns
  const { data, error } = await supabase
    .from('registros_saude')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching rows:', error.message);
  } else {
    console.log('Sample row data:', data);
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Table is empty. Let us check columns by selecting dynamic keys or query pg.');
      // Fallback query to get table metadata via public RPC or just try standard column names
    }
  }
}

checkColumns();
