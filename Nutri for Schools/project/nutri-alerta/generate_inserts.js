const fs = require('fs');

const schoolsList = [
  "E.E. BARAO DE PIRACICABA",
  "E.E. CAROLINA AUGUSTA SERAPHIM PROFESSORA",
  "E.E. DELCIO BACCARO PROFESSOR",
  "E.E. HELOISA LEMENHE MARASCA PROFESSORA",
  "E.E. JANUARIO SYLVIO PEZZOTTI PROFESSOR",
  "E.E. JOAO BAPTISTA NEGRAO FILHO PROFESSOR",
  "E.E. JOAO BATISTA LEME PROFESSOR",
  "E.E. JOAQUIM RIBEIRO",
  "E.E. JOAQUIM SALLES CORONEL",
  "E.E. JOSE CARDOSO PROFESSOR",
  "E.E. JOSE FERNANDES PROFESSOR",
  "E.E. MARCIANO DE TOLEDO PIZA PROFESSOR",
  "E.E. MICHEL ANTONIO ALEM PROFESSOR",
  "E.E. NELSON STROILI PROFESSOR",
  "E.E. ODILON CORREA PROFESSOR",
  "E.E. OSCALIA GOES CORREA SANTOS PROFESSORA",
  "E.E. OSCAR DE ALMEIDA PROFESSOR",
  "E.E. RAUL FERNANDES CHANCELER",
  "E.E. ROBERTO GARCIA LOSZ PROFESSOR",
  "E.E. ZITA DE GODOY CAMARGO PROFESSORA",
  "E.M. Aldo Zottarelli Junior",
  "E.M. Antônio Maria Marrote",
  "E.M. Antônio Sebastião da Silva",
  "E.M. Aparecida José Carlini Bonilha",
  "E.M. Arlindo Ansanello",
  "E.M. Benedicto José Zaine",
  "E.M. Benjamin Ferreira",
  "E.M. Caminho da Vida Profª Margarida Penteado",
  "E.M. Clara Freire Castellano",
  "E.M. Comecinho de Vida Professora Diva Cabral de Oliveira",
  "E.M. Dante Egreggio",
  "E.M. Darci Reginatto",
  "E.M. Dennizard França Machado",
  "E.M. Diva Marques Gouvêa",
  "E.M. Djalma Camargo Outeiro Pinto Dr.",
  "E.M. Djiliah Camargo de Souza",
  "E.M. Edna Cristina Fardim Fernandes",
  "E.M. Elpídio Mina",
  "E.M. Ephraim Ribeiro dos Santos",
  "E.M. Francesco Paoli",
  "E.M. Francisca Coan",
  "E.M. Gisele Brizotti Ferraz Ferreira",
  "E.M. Gunar Wilhelm Koelle",
  "E.M. Hélio Jorge dos Santos",
  "E.M. Isolina Huppert Cassavia",
  "E.M. Jardim das Palmeiras",
  "E.M. José Martins da Silva",
  "E.M. José de Campos Chagas",
  "E.M. Jovelina Morateli",
  "E.M. João Batista Maule",
  "E.M. João Rehder Netto",
  "E.M. Laura Penna Joly",
  "E.M. Lucidia T. Cassavia Escrivão Soares",
  "E.M. Luiz Martins Rodrigues Filho",
  "E.M. Lygia do Carmo P. Vendramel",
  "E.M. Lúcia Aparecida Buschinelli Carneiro",
  "E.M. Lúcia Helena Ferreira Camargo",
  "E.M. Marcello Schmidt",
  "E.M. Marcello Schmidt Unidade 2",
  "E.M. Maria Aparecida Polastri Hartung - Dona Birro",
  "E.M. Maria Isabel Soares",
  "E.M. Maria Teixeira Fittipaldi",
  "E.M. Marilda dos Santos Souza",
  "E.M. Marina Fredine Dainese Cyrino",
  "E.M. Mitiko Matsushita Nevoeiro",
  "E.M. Monsenhor Martins",
  "E.M. Mora Guimarães",
  "E.M. Nephtali Vieira Junior Pastor",
  "E.M. Octávio José Chiossi",
  "E.M. Paulo Koelle Dr.",
  "E.M. Rosa Maria Castellano Pieroni",
  "E.M. Rubens Foot Guimarães - Escola Agrícola",
  "E.M. Rutinéia Paulino de Souza Ferreira da Silva",
  "E.M. Samira Assêncio Savoldi",
  "E.M. Santo Antônio de Pádua",
  "E.M. Sebastião Ambrózio",
  "E.M. Sueli Aparecida Marin",
  "E.M. Sueli Maria Proni Cerri",
  "E.M. Sylvio de Araújo",
  "E.M. Sérgio Hernani Fittipaldi",
  "E.M. Theodoro Paulo Koelle",
  "E.M. Victorino Machado",
  "E.M. Ângela Mônaco Perin Aily"
];

function normalizeText(text) {
  return text.normalize("NFD")
             .replace(/[\u0300-\u036f]/g, "")
             .replace(/ª/g, "a")
             .replace(/º/g, "o");
}

let sql = `-- =========================================================================\n`;
sql += `-- SCRIPT DE INSERÇÃO EM MASSA: ESCOLAS E CONTAS DE ACESSO\n`;
sql += `-- =========================================================================\n\n`;
sql += `DO $$\nDECLARE\n  school_id integer;\n  user_uuid uuid;\nBEGIN\n`;
sql += `  -- Corrigir valores nulos nos usuários existentes para evitar erro de schema no GoTrue
  UPDATE auth.users 
  SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, '');

  -- Limpar dados anteriores para evitar duplicidades/conflitos\n`;
sql += `  DELETE FROM public.registros_saude;\n`;
sql += `  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email != 'nutrialerta@gmail.com');\n`;
sql += `  DELETE FROM auth.users WHERE email != 'nutrialerta@gmail.com';\n`;
sql += `  DELETE FROM public.escolas;\n\n`;

const credentials = [];

for (const rawName of schoolsList) {
  const schoolName = rawName.trim();
  const normalizedName = normalizeText(schoolName).toLowerCase();
  
  // Parse Email Prefix (points replaced by underscores)
  let emailPrefix = normalizedName;
  // Replace E.E. or E.M.
  emailPrefix = emailPrefix.replace(/^e\.e\.\s*/, 'ee_');
  emailPrefix = emailPrefix.replace(/^e\.m\.\s*/, 'em_');
  emailPrefix = emailPrefix.replace(/[^a-z0-9_]/g, '_');
  emailPrefix = emailPrefix.replace(/_+/g, '_').replace(/^_|_$/g, '');
  
  const email = `${emailPrefix}@nutrialerta.com`;
  
  // Parse Password (no spaces, only alphanumeric)
  let pwdBase = normalizedName;
  pwdBase = pwdBase.replace(/^e\.e\.\s*/, '');
  pwdBase = pwdBase.replace(/^e\.m\.\s*/, '');
  pwdBase = pwdBase.replace(/[^a-z0-9]/g, '');
  const password = `${pwdBase}@nutrialerta`;
  
  credentials.push({ schoolName, email, password });
  
  sql += `  -- Inserindo Escola: ${schoolName}\n`;
  sql += `  INSERT INTO public.escolas (nome, bairro)\n`;
  sql += `  VALUES ('${schoolName.replace(/'/g, "''")}', NULL)\n`;
  sql += `  RETURNING id INTO school_id;\n\n`;
  
  sql += `  -- Gerando UUID para o Usuário\n`;
  sql += `  user_uuid := gen_random_uuid();\n\n`;
  
  sql += `  -- Inserindo no auth.users\n`;
  sql += `  INSERT INTO auth.users (\n`;
  sql += `    id, instance_id, email, encrypted_password, email_confirmed_at,\n`;
  sql += `    raw_app_meta_data, raw_user_meta_data, role, aud,\n`;
  sql += `    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,\n`;
  sql += `    email_change, email_change_token_current, phone_change_token, reauthentication_token\n`;
  sql += `  )\n`;
  sql += `  VALUES (\n`;
  sql += `    user_uuid,\n`;
  sql += `    '00000000-0000-0000-0000-000000000000',\n`;
  sql += `    '${email}',\n`;
  sql += `    crypt('${password}', gen_salt('bf')),\n`;
  sql += `    now(),\n`;
  sql += `    '{"provider":"email","providers":["email"]}'::jsonb,\n`;
  sql += `    jsonb_build_object('school_name', '${schoolName.replace(/'/g, "''")}', 'escola_id', school_id, 'role', 'school'),\n`;
  sql += `    'authenticated',\n`;
  sql += `    'authenticated',\n`;
  sql += `    now(),\n`;
  sql += `    now(),\n`;
  sql += `    '',\n`;
  sql += `    '',\n`;
  sql += `    '',\n`;
  sql += `    '',\n`;
  sql += `    '',\n`;
  sql += `    '',\n`;
  sql += `    ''\n`;
  sql += `  );\n\n`;

  sql += `  -- Vincular identidade para permitir login pelo GoTrue\n`;
  sql += `  INSERT INTO auth.identities (\n`;
  sql += `    id,\n`;
  sql += `    user_id,\n`;
  sql += `    identity_data,\n`;
  sql += `    provider,\n`;
  sql += `    provider_id,\n`;
  sql += `    last_sign_in_at,\n`;
  sql += `    created_at,\n`;
  sql += `    updated_at\n`;
  sql += `  )\n`;
  sql += `  VALUES (\n`;
  sql += `    user_uuid,\n`;
  sql += `    user_uuid,\n`;
  sql += `    jsonb_build_object('sub', user_uuid::text, 'email', '${email}'),\n`;
  sql += `    'email',\n`;
  sql += `    user_uuid::text,\n`;
  sql += `    now(),\n`;
  sql += `    now(),\n`;
  sql += `    now()\n`;
  sql += `  );\n\n`;
}

sql += `END $$;\n`;

fs.writeFileSync('insert_schools_and_users.sql', sql);
console.log('SQL script generated successfully in insert_schools_and_users.sql!');
console.log(JSON.stringify(credentials, null, 2));
