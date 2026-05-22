const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envPath = './.env.local';
console.log('Loading environment from:', envPath);

let supabaseUrl, supabaseAnonKey;
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.trim().startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.split('=')[1].trim();
    }
  }
} catch (err) {
  console.error('Error reading env file:', err.message);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function runSuperadminTest() {
  console.log('\n=========================================');
  console.log('STARTING SUPERADMIN AUTH & DATABASE FLOW TEST');
  console.log('=========================================');

  const email = 'nutrialertafatec@gmail.com';
  const password = '#Pangam123@';

  console.log(`[Auth] Attempting login as ${email}...`);
  let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (signInError) {
    console.log('❌ Login failed:', signInError.message);
    if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('Email not confirmed') || signInError.message.includes('Database error')) {
      console.log('[Auth] Attempting auto-signup fallback for Superadmin...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Superadmin',
            role: 'superadmin'
          }
        }
      });

      if (signUpError) {
        console.error('❌ Superadmin signup fallback failed:', signUpError.message);
        process.exit(1);
      } else {
        console.log('✅ Superadmin signup fallback succeeded!');
        if (signUpData.session) {
          console.log('Session acquired directly from signup.');
          signInData = signUpData;
        } else {
          console.log('⚠️ Signup succeeded, but no session returned.');
          console.log('User object:', JSON.stringify(signUpData.user, null, 2));
        }
      }
    } else {
      process.exit(1);
    }
  } else {
    console.log('✅ Login succeeded! Session active.');
  }

  if (signInData && signInData.session) {
    const session = signInData.session;
    console.log('Authenticated User ID:', session.user.id);
    console.log('User Role:', session.user.user_metadata?.role);
  }
}

runSuperadminTest();
