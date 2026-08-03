-- ============================================================================
-- SCHEMA: Estoque Pisos (Só Madeiras)
-- DESCRIÇÃO: Script completo de configuração do banco de dados para o Supabase
-- ============================================================================

-- ============================================================================
-- 1. TABELAS (TABLES)
-- ============================================================================

-- Tabela de Perfis de Usuários
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    nome_exibicao TEXT,
    email TEXT NOT NULL,
    telefone TEXT,
    tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('admin', 'vendedor')) DEFAULT 'vendedor',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Pisos (Estoque de produtos)
CREATE TABLE pisos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    marca TEXT,
    codigo TEXT UNIQUE,
    modelo TEXT,
    linha TEXT,
    cor TEXT,
    dimensao TEXT, -- Ex: '60x60 cm'
    tipo TEXT CHECK (tipo IN ('ceramica','porcelanato','acetinado','polido','outros')),
    quantidade_caixas INTEGER NOT NULL DEFAULT 0,
    metros_por_caixa NUMERIC(10,2) NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 0,
    localizacao TEXT,
    imagem_url TEXT,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Movimentações de Estoque
CREATE TABLE movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piso_id UUID NOT NULL REFERENCES pisos(id),
    tipo_movimentacao TEXT NOT NULL CHECK (tipo_movimentacao IN ('entrada','baixa','ajuste')),
    quantidade_caixas INTEGER NOT NULL,
    metros_quadrados NUMERIC(10,2),
    estoque_anterior INTEGER NOT NULL,
    estoque_posterior INTEGER NOT NULL,
    vendedor_id UUID REFERENCES profiles(id),
    numero_pedido TEXT,
    numero_referencia TEXT,
    motivo TEXT,
    observacao TEXT,
    usuario_responsavel_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================================
-- 2. ÍNDICES (INDEXES)
-- ============================================================================

-- Índices para otimizar buscas na tabela 'pisos'
CREATE INDEX idx_pisos_nome ON pisos(nome);
CREATE INDEX idx_pisos_codigo ON pisos(codigo);
CREATE INDEX idx_pisos_marca ON pisos(marca);
CREATE INDEX idx_pisos_cor ON pisos(cor);
CREATE INDEX idx_pisos_dimensao ON pisos(dimensao);
CREATE INDEX idx_pisos_ativo ON pisos(ativo);

-- Índices para otimizar buscas e filtros na tabela 'movimentacoes_estoque'
CREATE INDEX idx_movimentacoes_piso_id ON movimentacoes_estoque(piso_id);
CREATE INDEX idx_movimentacoes_vendedor_id ON movimentacoes_estoque(vendedor_id);
CREATE INDEX idx_movimentacoes_numero_pedido ON movimentacoes_estoque(numero_pedido);
CREATE INDEX idx_movimentacoes_created_at ON movimentacoes_estoque(created_at);
CREATE INDEX idx_movimentacoes_tipo ON movimentacoes_estoque(tipo_movimentacao);

-- Índices para a tabela 'profiles'
CREATE INDEX idx_profiles_tipo_usuario ON profiles(tipo_usuario);
CREATE INDEX idx_profiles_email ON profiles(email);


-- ============================================================================
-- 3. FUNÇÕES E TRIGGERS (FUNCTIONS AND TRIGGERS)
-- ============================================================================

-- Função utilitária para autualizar o campo updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicando trigger de updated_at para as tabelas 'profiles' e 'pisos'
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pisos_updated_at
BEFORE UPDATE ON pisos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Função e Trigger para auto-confirmar e-mail e criar perfil automaticamente no cadastro (auth.users)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, tipo_usuario)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'vendedor')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Funções RPC para manipulação atômica de estoque

-- 3.1 realizar_baixa_estoque
CREATE OR REPLACE FUNCTION realizar_baixa_estoque(
    p_piso_id UUID,
    p_quantidade INTEGER,
    p_vendedor_id UUID,
    p_numero_pedido TEXT,
    p_observacao TEXT,
    p_usuario_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_piso RECORD;
    v_estoque_anterior INTEGER;
    v_estoque_posterior INTEGER;
    v_metros_quadrados NUMERIC(10,2);
BEGIN
    -- Validar parâmetros básicos
    IF p_quantidade <= 0 THEN
        RAISE EXCEPTION 'A quantidade para baixa deve ser maior que zero.';
    END IF;

    -- Buscar e travar o registro do piso para garantir concorrência segura
    SELECT * INTO v_piso 
    FROM pisos 
    WHERE id = p_piso_id FOR UPDATE;

    -- Validar existência e estado do piso
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Piso não encontrado.';
    END IF;

    IF v_piso.ativo = FALSE THEN
        RAISE EXCEPTION 'Não é possível dar baixa em um piso inativo.';
    END IF;

    -- Validar se há estoque suficiente
    IF v_piso.quantidade_caixas < p_quantidade THEN
        RAISE EXCEPTION 'Estoque insuficiente para a baixa solicitada (Disponível: %, Solicitado: %).', v_piso.quantidade_caixas, p_quantidade;
    END IF;

    -- Calcular valores
    v_estoque_anterior := v_piso.quantidade_caixas;
    v_estoque_posterior := v_estoque_anterior - p_quantidade;
    v_metros_quadrados := p_quantidade * v_piso.metros_por_caixa;

    -- Atualizar o estoque na tabela pisos
    UPDATE pisos
    SET quantidade_caixas = v_estoque_posterior
    WHERE id = p_piso_id;

    -- Registrar a movimentação
    INSERT INTO movimentacoes_estoque (
        piso_id, tipo_movimentacao, quantidade_caixas, metros_quadrados,
        estoque_anterior, estoque_posterior, vendedor_id, numero_pedido,
        observacao, usuario_responsavel_id
    ) VALUES (
        p_piso_id, 'baixa', p_quantidade, v_metros_quadrados,
        v_estoque_anterior, v_estoque_posterior, p_vendedor_id, p_numero_pedido,
        p_observacao, p_usuario_id
    );

    -- Retornar resultado como JSONB
    RETURN jsonb_build_object(
        'success', true,
        'estoque_anterior', v_estoque_anterior,
        'estoque_posterior', v_estoque_posterior,
        'metros_quadrados', v_metros_quadrados
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3.2 realizar_entrada_estoque
CREATE OR REPLACE FUNCTION realizar_entrada_estoque(
    p_piso_id UUID,
    p_quantidade INTEGER,
    p_numero_referencia TEXT,
    p_observacao TEXT,
    p_usuario_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_piso RECORD;
    v_estoque_anterior INTEGER;
    v_estoque_posterior INTEGER;
    v_metros_quadrados NUMERIC(10,2);
BEGIN
    IF p_quantidade <= 0 THEN
        RAISE EXCEPTION 'A quantidade para entrada deve ser maior que zero.';
    END IF;

    SELECT * INTO v_piso 
    FROM pisos 
    WHERE id = p_piso_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Piso não encontrado.';
    END IF;

    v_estoque_anterior := v_piso.quantidade_caixas;
    v_estoque_posterior := v_estoque_anterior + p_quantidade;
    v_metros_quadrados := p_quantidade * v_piso.metros_por_caixa;

    UPDATE pisos
    SET quantidade_caixas = v_estoque_posterior
    WHERE id = p_piso_id;

    INSERT INTO movimentacoes_estoque (
        piso_id, tipo_movimentacao, quantidade_caixas, metros_quadrados,
        estoque_anterior, estoque_posterior, numero_referencia,
        observacao, usuario_responsavel_id
    ) VALUES (
        p_piso_id, 'entrada', p_quantidade, v_metros_quadrados,
        v_estoque_anterior, v_estoque_posterior, p_numero_referencia,
        p_observacao, p_usuario_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'estoque_anterior', v_estoque_anterior,
        'estoque_posterior', v_estoque_posterior,
        'metros_quadrados', v_metros_quadrados
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3.3 realizar_ajuste_estoque
CREATE OR REPLACE FUNCTION realizar_ajuste_estoque(
    p_piso_id UUID,
    p_quantidade_nova INTEGER,
    p_motivo TEXT,
    p_observacao TEXT,
    p_usuario_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_piso RECORD;
    v_estoque_anterior INTEGER;
    v_diferenca INTEGER;
    v_metros_quadrados NUMERIC(10,2);
BEGIN
    IF p_quantidade_nova < 0 THEN
        RAISE EXCEPTION 'A nova quantidade para ajuste não pode ser negativa.';
    END IF;

    IF TRIM(COALESCE(p_motivo, '')) = '' THEN
        RAISE EXCEPTION 'O motivo do ajuste é obrigatório.';
    END IF;

    SELECT * INTO v_piso 
    FROM pisos 
    WHERE id = p_piso_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Piso não encontrado.';
    END IF;

    v_estoque_anterior := v_piso.quantidade_caixas;
    v_diferenca := p_quantidade_nova - v_estoque_anterior;
    v_metros_quadrados := v_diferenca * v_piso.metros_por_caixa;

    UPDATE pisos
    SET quantidade_caixas = p_quantidade_nova
    WHERE id = p_piso_id;

    INSERT INTO movimentacoes_estoque (
        piso_id, tipo_movimentacao, quantidade_caixas, metros_quadrados,
        estoque_anterior, estoque_posterior, motivo,
        observacao, usuario_responsavel_id
    ) VALUES (
        p_piso_id, 'ajuste', v_diferenca, v_metros_quadrados,
        v_estoque_anterior, p_quantidade_nova, p_motivo,
        p_observacao, p_usuario_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'estoque_anterior', v_estoque_anterior,
        'estoque_posterior', p_quantidade_nova,
        'diferenca', v_diferenca,
        'metros_quadrados_diferenca', v_metros_quadrados
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 4. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_tipo_usuario TEXT;
BEGIN
    SELECT tipo_usuario INTO v_tipo_usuario
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(v_tipo_usuario = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Políticas para 'profiles'
CREATE POLICY "Admin tem acesso total" ON profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Usuários podem ver seu próprio perfil" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Políticas para 'pisos' (permitir cadastro e leitura sem bloqueios RLS)
DROP POLICY IF EXISTS "Admin tem acesso total aos pisos" ON pisos;
DROP POLICY IF EXISTS "Vendedores podem ver pisos ativos" ON pisos;
DROP POLICY IF EXISTS "Acesso livre aos pisos" ON pisos;

CREATE POLICY "Acesso livre aos pisos" ON pisos
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para 'movimentacoes_estoque'
CREATE POLICY "Admin tem acesso de leitura e inserção nas movimentações" ON movimentacoes_estoque
    FOR ALL
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Vendedores podem ver suas próprias movimentações" ON movimentacoes_estoque
    FOR SELECT
    TO authenticated
    USING (
        vendedor_id = auth.uid() OR 
        usuario_responsavel_id = auth.uid()
    );
-- Nota: Inserções para vendedores ocorrem via funções SECURITY DEFINER, sem necessidade de política de INSERT


-- ============================================================================
-- 5. ARMAZENAMENTO (STORAGE)
-- ============================================================================

-- Inserir bucket 'piso-images' na tabela storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'piso-images', 
    'piso-images', 
    true, 
    5242880, 
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para o bucket 'piso-images'
CREATE POLICY "Usuários autenticados podem fazer upload de imagens" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'piso-images');

CREATE POLICY "Acesso público de leitura às imagens" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'piso-images');

CREATE POLICY "Admin pode deletar imagens" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'piso-images' AND public.is_admin());

-- Permitir SELECT de authenticated também para facilitar algumas integrações do storage
CREATE POLICY "Usuários autenticados podem consultar imagens" ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'piso-images');
