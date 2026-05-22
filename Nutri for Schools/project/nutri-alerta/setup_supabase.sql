-- =========================================================================
-- SCRIPT DE CONFIGURAÇÃO COMPLETA: TABELAS, TRIGGERS E POLÍTICAS RLS
-- =========================================================================

-- 1. CRIAR TABELA DE ESCOLAS
CREATE TABLE IF NOT EXISTS public.escolas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    bairro TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CRIAR TABELA DE USUÁRIOS (PERFIS)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'school' CHECK (role IN ('superadmin', 'school')),
    escola_id INTEGER REFERENCES public.escolas(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CRIAR TABELA DE REGISTROS DE SAÚDE
CREATE TABLE IF NOT EXISTS public.registros_saude (
    id SERIAL PRIMARY KEY,
    escola_id INTEGER NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    genero TEXT NOT NULL CHECK (genero IN ('M', 'F')),
    idade INTEGER NOT NULL,
    peso NUMERIC(5,2) NOT NULL,
    altura NUMERIC(3,2) NOT NULL,
    data_coleta TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- TRIGGERS DE AUTOMAÇÃO E SINCRONIZAÇÃO COM SUPABASE AUTH
-- =========================================================================

-- Função para lidar com novo usuário cadastrado no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, role, escola_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'school_name', 'Escola'),
    COALESCE(new.raw_user_meta_data->>'role', 'school'),
    (new.raw_user_meta_data->>'escola_id')::integer
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    role = EXCLUDED.role,
    escola_id = EXCLUDED.escola_id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger de criação no Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para lidar com atualizações de usuários no Auth
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS trigger AS $$
BEGIN
  UPDATE public.usuarios
  SET 
    email = new.email,
    nome = COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'school_name', nome),
    role = COALESCE(new.raw_user_meta_data->>'role', role),
    escola_id = (new.raw_user_meta_data->>'escola_id')::integer
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger de atualização no Auth
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

-- =========================================================================
-- CONFIGURAÇÕES DE ROW LEVEL SECURITY (RLS) - CLAIMS JWT DIRETAS
-- =========================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_saude ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar duplicidade ou conflitos
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.escolas;
DROP POLICY IF EXISTS "Allow insert for superadmin" ON public.escolas;
DROP POLICY IF EXISTS "Allow update for superadmin" ON public.escolas;
DROP POLICY IF EXISTS "Allow delete for superadmin" ON public.escolas;

DROP POLICY IF EXISTS "Allow select for owner and superadmin" ON public.usuarios;
DROP POLICY IF EXISTS "Allow insert for owner and superadmin" ON public.usuarios;
DROP POLICY IF EXISTS "Allow update for owner and superadmin" ON public.usuarios;
DROP POLICY IF EXISTS "Allow delete for superadmin" ON public.usuarios;

DROP POLICY IF EXISTS "Allow select for school users and superadmin" ON public.registros_saude;
DROP POLICY IF EXISTS "Allow insert for school users and superadmin" ON public.registros_saude;
DROP POLICY IF EXISTS "Allow update for school users and superadmin" ON public.registros_saude;
DROP POLICY IF EXISTS "Allow delete for school users and superadmin" ON public.registros_saude;

-- --- POLÍTICAS PARA: escolas ---

CREATE POLICY "Allow select for authenticated" ON public.escolas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for superadmin" ON public.escolas
  FOR INSERT TO authenticated WITH CHECK ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' );

CREATE POLICY "Allow update for superadmin" ON public.escolas
  FOR UPDATE TO authenticated USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' );

CREATE POLICY "Allow delete for superadmin" ON public.escolas
  FOR DELETE TO authenticated USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' );

-- --- POLÍTICAS PARA: usuarios ---

CREATE POLICY "Allow select for owner and superadmin" ON public.usuarios
  FOR SELECT TO authenticated USING ( auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' );

CREATE POLICY "Allow insert for owner and superadmin" ON public.usuarios
  FOR INSERT WITH CHECK ( auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' );

CREATE POLICY "Allow update for owner and superadmin" ON public.usuarios
  FOR UPDATE TO authenticated USING ( auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' );

CREATE POLICY "Allow delete for superadmin" ON public.usuarios
  FOR DELETE TO authenticated USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' );

-- --- POLÍTICAS PARA: registros_saude ---

CREATE POLICY "Allow select for school users and superadmin" ON public.registros_saude
  FOR SELECT TO authenticated USING ( 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'escola_id')::integer = escola_id 
  );

CREATE POLICY "Allow insert for school users and superadmin" ON public.registros_saude
  FOR INSERT TO authenticated WITH CHECK ( 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'escola_id')::integer = escola_id 
  );

CREATE POLICY "Allow update for school users and superadmin" ON public.registros_saude
  FOR UPDATE TO authenticated USING ( 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'escola_id')::integer = escola_id 
  );

CREATE POLICY "Allow delete for school users and superadmin" ON public.registros_saude
  FOR DELETE TO authenticated USING ( 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'superadmin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'escola_id')::integer = escola_id 
  );

-- =========================================================================
-- 4. GARANTIR QUE O USUÁRIO EXISTENTE SEJA SUPERADMIN
-- =========================================================================
UPDATE public.usuarios
SET role = 'superadmin', nome = 'Superadmin'
WHERE email = 'nutrialerta@gmail.com';
