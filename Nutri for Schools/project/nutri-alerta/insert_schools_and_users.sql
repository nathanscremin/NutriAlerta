-- =========================================================================
-- SCRIPT DE INSERÇÃO EM MASSA: ESCOLAS E CONTAS DE ACESSO
-- =========================================================================

DO $$
DECLARE
  school_id integer;
  user_uuid uuid;
BEGIN
  -- Corrigir valores nulos nos usuários existentes para evitar erro de schema no GoTrue
  UPDATE auth.users 
  SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    phone_change_token = COALESCE(phone_change_token, ''),
    reauthentication_token = COALESCE(reauthentication_token, '');

  -- Limpar dados anteriores para evitar duplicidades/conflitos
  DELETE FROM public.registros_saude;
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email != 'nutrialerta@gmail.com');
  DELETE FROM auth.users WHERE email != 'nutrialerta@gmail.com';
  DELETE FROM public.escolas;

  -- Inserindo Escola: E.E. BARAO DE PIRACICABA
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. BARAO DE PIRACICABA', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_barao_de_piracicaba@nutrialerta.com',
    crypt('baraodepiracicaba@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. BARAO DE PIRACICABA', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_barao_de_piracicaba@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. CAROLINA AUGUSTA SERAPHIM PROFESSORA
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. CAROLINA AUGUSTA SERAPHIM PROFESSORA', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_carolina_augusta_seraphim_professora@nutrialerta.com',
    crypt('carolinaaugustaseraphimprofessora@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. CAROLINA AUGUSTA SERAPHIM PROFESSORA', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_carolina_augusta_seraphim_professora@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. DELCIO BACCARO PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. DELCIO BACCARO PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_delcio_baccaro_professor@nutrialerta.com',
    crypt('delciobaccaroprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. DELCIO BACCARO PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_delcio_baccaro_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. HELOISA LEMENHE MARASCA PROFESSORA
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. HELOISA LEMENHE MARASCA PROFESSORA', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_heloisa_lemenhe_marasca_professora@nutrialerta.com',
    crypt('heloisalemenhemarascaprofessora@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. HELOISA LEMENHE MARASCA PROFESSORA', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_heloisa_lemenhe_marasca_professora@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. JANUARIO SYLVIO PEZZOTTI PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. JANUARIO SYLVIO PEZZOTTI PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_januario_sylvio_pezzotti_professor@nutrialerta.com',
    crypt('januariosylviopezzottiprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. JANUARIO SYLVIO PEZZOTTI PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_januario_sylvio_pezzotti_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. JOAO BAPTISTA NEGRAO FILHO PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. JOAO BAPTISTA NEGRAO FILHO PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_joao_baptista_negrao_filho_professor@nutrialerta.com',
    crypt('joaobaptistanegraofilhoprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. JOAO BAPTISTA NEGRAO FILHO PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_joao_baptista_negrao_filho_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. JOAO BATISTA LEME PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. JOAO BATISTA LEME PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_joao_batista_leme_professor@nutrialerta.com',
    crypt('joaobatistalemeprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. JOAO BATISTA LEME PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_joao_batista_leme_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. JOAQUIM RIBEIRO
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. JOAQUIM RIBEIRO', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_joaquim_ribeiro@nutrialerta.com',
    crypt('joaquimribeiro@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. JOAQUIM RIBEIRO', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_joaquim_ribeiro@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. JOAQUIM SALLES CORONEL
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. JOAQUIM SALLES CORONEL', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_joaquim_salles_coronel@nutrialerta.com',
    crypt('joaquimsallescoronel@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. JOAQUIM SALLES CORONEL', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_joaquim_salles_coronel@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. JOSE CARDOSO PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. JOSE CARDOSO PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_jose_cardoso_professor@nutrialerta.com',
    crypt('josecardosoprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. JOSE CARDOSO PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_jose_cardoso_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. JOSE FERNANDES PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. JOSE FERNANDES PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_jose_fernandes_professor@nutrialerta.com',
    crypt('josefernandesprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. JOSE FERNANDES PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_jose_fernandes_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. MARCIANO DE TOLEDO PIZA PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. MARCIANO DE TOLEDO PIZA PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_marciano_de_toledo_piza_professor@nutrialerta.com',
    crypt('marcianodetoledopizaprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. MARCIANO DE TOLEDO PIZA PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_marciano_de_toledo_piza_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. MICHEL ANTONIO ALEM PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. MICHEL ANTONIO ALEM PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_michel_antonio_alem_professor@nutrialerta.com',
    crypt('michelantonioalemprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. MICHEL ANTONIO ALEM PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_michel_antonio_alem_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. NELSON STROILI PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. NELSON STROILI PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_nelson_stroili_professor@nutrialerta.com',
    crypt('nelsonstroiliprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. NELSON STROILI PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_nelson_stroili_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. ODILON CORREA PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. ODILON CORREA PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_odilon_correa_professor@nutrialerta.com',
    crypt('odiloncorreaprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. ODILON CORREA PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_odilon_correa_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. OSCALIA GOES CORREA SANTOS PROFESSORA
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. OSCALIA GOES CORREA SANTOS PROFESSORA', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_oscalia_goes_correa_santos_professora@nutrialerta.com',
    crypt('oscaliagoescorreasantosprofessora@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. OSCALIA GOES CORREA SANTOS PROFESSORA', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_oscalia_goes_correa_santos_professora@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. OSCAR DE ALMEIDA PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. OSCAR DE ALMEIDA PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_oscar_de_almeida_professor@nutrialerta.com',
    crypt('oscardealmeidaprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. OSCAR DE ALMEIDA PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_oscar_de_almeida_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. RAUL FERNANDES CHANCELER
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. RAUL FERNANDES CHANCELER', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_raul_fernandes_chanceler@nutrialerta.com',
    crypt('raulfernandeschanceler@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. RAUL FERNANDES CHANCELER', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_raul_fernandes_chanceler@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. ROBERTO GARCIA LOSZ PROFESSOR
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. ROBERTO GARCIA LOSZ PROFESSOR', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_roberto_garcia_losz_professor@nutrialerta.com',
    crypt('robertogarcialoszprofessor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. ROBERTO GARCIA LOSZ PROFESSOR', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_roberto_garcia_losz_professor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.E. ZITA DE GODOY CAMARGO PROFESSORA
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.E. ZITA DE GODOY CAMARGO PROFESSORA', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'ee_zita_de_godoy_camargo_professora@nutrialerta.com',
    crypt('zitadegodoycamargoprofessora@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.E. ZITA DE GODOY CAMARGO PROFESSORA', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'ee_zita_de_godoy_camargo_professora@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Aldo Zottarelli Junior
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Aldo Zottarelli Junior', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_aldo_zottarelli_junior@nutrialerta.com',
    crypt('aldozottarellijunior@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Aldo Zottarelli Junior', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_aldo_zottarelli_junior@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Antônio Maria Marrote
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Antônio Maria Marrote', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_antonio_maria_marrote@nutrialerta.com',
    crypt('antoniomariamarrote@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Antônio Maria Marrote', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_antonio_maria_marrote@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Antônio Sebastião da Silva
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Antônio Sebastião da Silva', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_antonio_sebastiao_da_silva@nutrialerta.com',
    crypt('antoniosebastiaodasilva@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Antônio Sebastião da Silva', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_antonio_sebastiao_da_silva@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Aparecida José Carlini Bonilha
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Aparecida José Carlini Bonilha', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_aparecida_jose_carlini_bonilha@nutrialerta.com',
    crypt('aparecidajosecarlinibonilha@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Aparecida José Carlini Bonilha', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_aparecida_jose_carlini_bonilha@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Arlindo Ansanello
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Arlindo Ansanello', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_arlindo_ansanello@nutrialerta.com',
    crypt('arlindoansanello@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Arlindo Ansanello', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_arlindo_ansanello@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Benedicto José Zaine
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Benedicto José Zaine', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_benedicto_jose_zaine@nutrialerta.com',
    crypt('benedictojosezaine@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Benedicto José Zaine', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_benedicto_jose_zaine@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Benjamin Ferreira
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Benjamin Ferreira', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_benjamin_ferreira@nutrialerta.com',
    crypt('benjaminferreira@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Benjamin Ferreira', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_benjamin_ferreira@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Caminho da Vida Profª Margarida Penteado
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Caminho da Vida Profª Margarida Penteado', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_caminho_da_vida_profa_margarida_penteado@nutrialerta.com',
    crypt('caminhodavidaprofamargaridapenteado@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Caminho da Vida Profª Margarida Penteado', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_caminho_da_vida_profa_margarida_penteado@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Clara Freire Castellano
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Clara Freire Castellano', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_clara_freire_castellano@nutrialerta.com',
    crypt('clarafreirecastellano@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Clara Freire Castellano', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_clara_freire_castellano@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Comecinho de Vida Professora Diva Cabral de Oliveira
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Comecinho de Vida Professora Diva Cabral de Oliveira', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_comecinho_de_vida_professora_diva_cabral_de_oliveira@nutrialerta.com',
    crypt('comecinhodevidaprofessoradivacabraldeoliveira@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Comecinho de Vida Professora Diva Cabral de Oliveira', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_comecinho_de_vida_professora_diva_cabral_de_oliveira@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Dante Egreggio
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Dante Egreggio', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_dante_egreggio@nutrialerta.com',
    crypt('danteegreggio@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Dante Egreggio', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_dante_egreggio@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Darci Reginatto
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Darci Reginatto', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_darci_reginatto@nutrialerta.com',
    crypt('darcireginatto@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Darci Reginatto', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_darci_reginatto@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Dennizard França Machado
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Dennizard França Machado', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_dennizard_franca_machado@nutrialerta.com',
    crypt('dennizardfrancamachado@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Dennizard França Machado', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_dennizard_franca_machado@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Diva Marques Gouvêa
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Diva Marques Gouvêa', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_diva_marques_gouvea@nutrialerta.com',
    crypt('divamarquesgouvea@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Diva Marques Gouvêa', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_diva_marques_gouvea@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Djalma Camargo Outeiro Pinto Dr.
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Djalma Camargo Outeiro Pinto Dr.', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_djalma_camargo_outeiro_pinto_dr@nutrialerta.com',
    crypt('djalmacamargoouteiropintodr@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Djalma Camargo Outeiro Pinto Dr.', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_djalma_camargo_outeiro_pinto_dr@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Djiliah Camargo de Souza
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Djiliah Camargo de Souza', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_djiliah_camargo_de_souza@nutrialerta.com',
    crypt('djiliahcamargodesouza@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Djiliah Camargo de Souza', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_djiliah_camargo_de_souza@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Edna Cristina Fardim Fernandes
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Edna Cristina Fardim Fernandes', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_edna_cristina_fardim_fernandes@nutrialerta.com',
    crypt('ednacristinafardimfernandes@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Edna Cristina Fardim Fernandes', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_edna_cristina_fardim_fernandes@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Elpídio Mina
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Elpídio Mina', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_elpidio_mina@nutrialerta.com',
    crypt('elpidiomina@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Elpídio Mina', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_elpidio_mina@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Ephraim Ribeiro dos Santos
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Ephraim Ribeiro dos Santos', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_ephraim_ribeiro_dos_santos@nutrialerta.com',
    crypt('ephraimribeirodossantos@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Ephraim Ribeiro dos Santos', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_ephraim_ribeiro_dos_santos@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Francesco Paoli
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Francesco Paoli', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_francesco_paoli@nutrialerta.com',
    crypt('francescopaoli@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Francesco Paoli', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_francesco_paoli@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Francisca Coan
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Francisca Coan', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_francisca_coan@nutrialerta.com',
    crypt('franciscacoan@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Francisca Coan', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_francisca_coan@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Gisele Brizotti Ferraz Ferreira
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Gisele Brizotti Ferraz Ferreira', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_gisele_brizotti_ferraz_ferreira@nutrialerta.com',
    crypt('giselebrizottiferrazferreira@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Gisele Brizotti Ferraz Ferreira', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_gisele_brizotti_ferraz_ferreira@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Gunar Wilhelm Koelle
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Gunar Wilhelm Koelle', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_gunar_wilhelm_koelle@nutrialerta.com',
    crypt('gunarwilhelmkoelle@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Gunar Wilhelm Koelle', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_gunar_wilhelm_koelle@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Hélio Jorge dos Santos
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Hélio Jorge dos Santos', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_helio_jorge_dos_santos@nutrialerta.com',
    crypt('heliojorgedossantos@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Hélio Jorge dos Santos', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_helio_jorge_dos_santos@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Isolina Huppert Cassavia
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Isolina Huppert Cassavia', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_isolina_huppert_cassavia@nutrialerta.com',
    crypt('isolinahuppertcassavia@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Isolina Huppert Cassavia', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_isolina_huppert_cassavia@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Jardim das Palmeiras
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Jardim das Palmeiras', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_jardim_das_palmeiras@nutrialerta.com',
    crypt('jardimdaspalmeiras@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Jardim das Palmeiras', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_jardim_das_palmeiras@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. José Martins da Silva
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. José Martins da Silva', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_jose_martins_da_silva@nutrialerta.com',
    crypt('josemartinsdasilva@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. José Martins da Silva', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_jose_martins_da_silva@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. José de Campos Chagas
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. José de Campos Chagas', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_jose_de_campos_chagas@nutrialerta.com',
    crypt('josedecamposchagas@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. José de Campos Chagas', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_jose_de_campos_chagas@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Jovelina Morateli
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Jovelina Morateli', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_jovelina_morateli@nutrialerta.com',
    crypt('jovelinamorateli@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Jovelina Morateli', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_jovelina_morateli@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. João Batista Maule
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. João Batista Maule', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_joao_batista_maule@nutrialerta.com',
    crypt('joaobatistamaule@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. João Batista Maule', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_joao_batista_maule@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. João Rehder Netto
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. João Rehder Netto', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_joao_rehder_netto@nutrialerta.com',
    crypt('joaorehdernetto@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. João Rehder Netto', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_joao_rehder_netto@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Laura Penna Joly
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Laura Penna Joly', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_laura_penna_joly@nutrialerta.com',
    crypt('laurapennajoly@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Laura Penna Joly', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_laura_penna_joly@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Lucidia T. Cassavia Escrivão Soares
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Lucidia T. Cassavia Escrivão Soares', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_lucidia_t_cassavia_escrivao_soares@nutrialerta.com',
    crypt('lucidiatcassaviaescrivaosoares@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Lucidia T. Cassavia Escrivão Soares', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_lucidia_t_cassavia_escrivao_soares@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Luiz Martins Rodrigues Filho
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Luiz Martins Rodrigues Filho', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_luiz_martins_rodrigues_filho@nutrialerta.com',
    crypt('luizmartinsrodriguesfilho@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Luiz Martins Rodrigues Filho', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_luiz_martins_rodrigues_filho@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Lygia do Carmo P. Vendramel
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Lygia do Carmo P. Vendramel', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_lygia_do_carmo_p_vendramel@nutrialerta.com',
    crypt('lygiadocarmopvendramel@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Lygia do Carmo P. Vendramel', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_lygia_do_carmo_p_vendramel@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Lúcia Aparecida Buschinelli Carneiro
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Lúcia Aparecida Buschinelli Carneiro', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_lucia_aparecida_buschinelli_carneiro@nutrialerta.com',
    crypt('luciaaparecidabuschinellicarneiro@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Lúcia Aparecida Buschinelli Carneiro', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_lucia_aparecida_buschinelli_carneiro@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Lúcia Helena Ferreira Camargo
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Lúcia Helena Ferreira Camargo', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_lucia_helena_ferreira_camargo@nutrialerta.com',
    crypt('luciahelenaferreiracamargo@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Lúcia Helena Ferreira Camargo', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_lucia_helena_ferreira_camargo@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Marcello Schmidt
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Marcello Schmidt', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_marcello_schmidt@nutrialerta.com',
    crypt('marcelloschmidt@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Marcello Schmidt', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_marcello_schmidt@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Marcello Schmidt Unidade 2
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Marcello Schmidt Unidade 2', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_marcello_schmidt_unidade_2@nutrialerta.com',
    crypt('marcelloschmidtunidade2@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Marcello Schmidt Unidade 2', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_marcello_schmidt_unidade_2@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Maria Aparecida Polastri Hartung - Dona Birro
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Maria Aparecida Polastri Hartung - Dona Birro', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_maria_aparecida_polastri_hartung_dona_birro@nutrialerta.com',
    crypt('mariaaparecidapolastrihartungdonabirro@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Maria Aparecida Polastri Hartung - Dona Birro', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_maria_aparecida_polastri_hartung_dona_birro@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Maria Isabel Soares
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Maria Isabel Soares', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_maria_isabel_soares@nutrialerta.com',
    crypt('mariaisabelsoares@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Maria Isabel Soares', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_maria_isabel_soares@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Maria Teixeira Fittipaldi
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Maria Teixeira Fittipaldi', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_maria_teixeira_fittipaldi@nutrialerta.com',
    crypt('mariateixeirafittipaldi@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Maria Teixeira Fittipaldi', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_maria_teixeira_fittipaldi@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Marilda dos Santos Souza
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Marilda dos Santos Souza', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_marilda_dos_santos_souza@nutrialerta.com',
    crypt('marildadossantossouza@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Marilda dos Santos Souza', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_marilda_dos_santos_souza@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Marina Fredine Dainese Cyrino
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Marina Fredine Dainese Cyrino', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_marina_fredine_dainese_cyrino@nutrialerta.com',
    crypt('marinafredinedainesecyrino@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Marina Fredine Dainese Cyrino', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_marina_fredine_dainese_cyrino@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Mitiko Matsushita Nevoeiro
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Mitiko Matsushita Nevoeiro', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_mitiko_matsushita_nevoeiro@nutrialerta.com',
    crypt('mitikomatsushitanevoeiro@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Mitiko Matsushita Nevoeiro', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_mitiko_matsushita_nevoeiro@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Monsenhor Martins
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Monsenhor Martins', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_monsenhor_martins@nutrialerta.com',
    crypt('monsenhormartins@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Monsenhor Martins', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_monsenhor_martins@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Mora Guimarães
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Mora Guimarães', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_mora_guimaraes@nutrialerta.com',
    crypt('moraguimaraes@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Mora Guimarães', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_mora_guimaraes@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Nephtali Vieira Junior Pastor
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Nephtali Vieira Junior Pastor', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_nephtali_vieira_junior_pastor@nutrialerta.com',
    crypt('nephtalivieirajuniorpastor@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Nephtali Vieira Junior Pastor', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_nephtali_vieira_junior_pastor@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Octávio José Chiossi
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Octávio José Chiossi', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_octavio_jose_chiossi@nutrialerta.com',
    crypt('octaviojosechiossi@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Octávio José Chiossi', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_octavio_jose_chiossi@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Paulo Koelle Dr.
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Paulo Koelle Dr.', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_paulo_koelle_dr@nutrialerta.com',
    crypt('paulokoelledr@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Paulo Koelle Dr.', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_paulo_koelle_dr@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Rosa Maria Castellano Pieroni
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Rosa Maria Castellano Pieroni', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_rosa_maria_castellano_pieroni@nutrialerta.com',
    crypt('rosamariacastellanopieroni@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Rosa Maria Castellano Pieroni', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_rosa_maria_castellano_pieroni@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Rubens Foot Guimarães - Escola Agrícola
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Rubens Foot Guimarães - Escola Agrícola', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_rubens_foot_guimaraes_escola_agricola@nutrialerta.com',
    crypt('rubensfootguimaraesescolaagricola@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Rubens Foot Guimarães - Escola Agrícola', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_rubens_foot_guimaraes_escola_agricola@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Rutinéia Paulino de Souza Ferreira da Silva
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Rutinéia Paulino de Souza Ferreira da Silva', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_rutineia_paulino_de_souza_ferreira_da_silva@nutrialerta.com',
    crypt('rutineiapaulinodesouzaferreiradasilva@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Rutinéia Paulino de Souza Ferreira da Silva', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_rutineia_paulino_de_souza_ferreira_da_silva@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Samira Assêncio Savoldi
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Samira Assêncio Savoldi', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_samira_assencio_savoldi@nutrialerta.com',
    crypt('samiraassenciosavoldi@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Samira Assêncio Savoldi', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_samira_assencio_savoldi@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Santo Antônio de Pádua
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Santo Antônio de Pádua', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_santo_antonio_de_padua@nutrialerta.com',
    crypt('santoantoniodepadua@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Santo Antônio de Pádua', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_santo_antonio_de_padua@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Sebastião Ambrózio
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Sebastião Ambrózio', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_sebastiao_ambrozio@nutrialerta.com',
    crypt('sebastiaoambrozio@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Sebastião Ambrózio', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_sebastiao_ambrozio@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Sueli Aparecida Marin
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Sueli Aparecida Marin', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_sueli_aparecida_marin@nutrialerta.com',
    crypt('sueliaparecidamarin@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Sueli Aparecida Marin', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_sueli_aparecida_marin@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Sueli Maria Proni Cerri
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Sueli Maria Proni Cerri', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_sueli_maria_proni_cerri@nutrialerta.com',
    crypt('suelimariapronicerri@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Sueli Maria Proni Cerri', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_sueli_maria_proni_cerri@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Sylvio de Araújo
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Sylvio de Araújo', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_sylvio_de_araujo@nutrialerta.com',
    crypt('sylviodearaujo@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Sylvio de Araújo', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_sylvio_de_araujo@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Sérgio Hernani Fittipaldi
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Sérgio Hernani Fittipaldi', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_sergio_hernani_fittipaldi@nutrialerta.com',
    crypt('sergiohernanifittipaldi@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Sérgio Hernani Fittipaldi', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_sergio_hernani_fittipaldi@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Theodoro Paulo Koelle
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Theodoro Paulo Koelle', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_theodoro_paulo_koelle@nutrialerta.com',
    crypt('theodoropaulokoelle@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Theodoro Paulo Koelle', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_theodoro_paulo_koelle@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Victorino Machado
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Victorino Machado', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_victorino_machado@nutrialerta.com',
    crypt('victorinomachado@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Victorino Machado', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_victorino_machado@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

  -- Inserindo Escola: E.M. Ângela Mônaco Perin Aily
  INSERT INTO public.escolas (nome, bairro)
  VALUES ('E.M. Ângela Mônaco Perin Aily', NULL)
  RETURNING id INTO school_id;

  -- Gerando UUID para o Usuário
  user_uuid := gen_random_uuid();

  -- Inserindo no auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, role, aud,
    created_at, updated_at, confirmation_token, recovery_token, email_change_token_new,
    email_change, email_change_token_current, phone_change_token, reauthentication_token
  )
  VALUES (
    user_uuid,
    '00000000-0000-0000-0000-000000000000',
    'em_angela_monaco_perin_aily@nutrialerta.com',
    crypt('angelamonacoperinaily@nutrialerta', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('school_name', 'E.M. Ângela Mônaco Perin Aily', 'escola_id', school_id, 'role', 'school'),
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  );

  -- Vincular identidade para permitir login pelo GoTrue
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    user_uuid,
    user_uuid,
    jsonb_build_object('sub', user_uuid::text, 'email', 'em_angela_monaco_perin_aily@nutrialerta.com'),
    'email',
    user_uuid::text,
    now(),
    now(),
    now()
  );

END $$;
