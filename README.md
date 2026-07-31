# Estoque Pisos

Sistema web completo de controle de estoque para pisos cerâmicos e porcelanatos. Interface profissional SaaS com experiência mobile nativa.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Armazenamento**: Supabase Storage
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Formulários**: React Hook Form + Zod
- **Deploy**: Vercel

## 📋 Funcionalidades

- ✅ Dashboard com indicadores e gráficos
- ✅ Cadastro completo de pisos com foto
- ✅ Controle de estoque em caixas e m²
- ✅ Baixa de estoque com validação atômica
- ✅ Entrada de mercadorias
- ✅ Ajuste de estoque (admin)
- ✅ Cadastro de vendedores
- ✅ Ranking de mais vendidos
- ✅ Histórico completo de movimentações
- ✅ Pesquisa inteligente com filtros
- ✅ Alertas de estoque baixo/crítico
- ✅ Autenticação com controle de acesso (Admin/Vendedor)
- ✅ Interface responsiva (mobile, tablet, desktop)
- ✅ Navegação mobile estilo aplicativo

## 🛠️ Como Instalar

### Pré-requisitos

- Node.js 18+ instalado
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com) (para deploy)
- Conta no [GitHub](https://github.com) (para versionamento)

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/estoque-pisos.git
cd estoque-pisos
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o Supabase

#### 3.1. Criar um projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project**
3. Escolha um nome (ex: `estoque-pisos`)
4. Defina uma senha para o banco de dados
5. Selecione a região mais próxima (ex: South America - São Paulo)
6. Aguarde a criação do projeto

#### 3.2. Executar o script SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase/schema.sql`
4. Cole no editor SQL
5. Clique em **Run** para executar
6. Verifique se todas as tabelas foram criadas em **Table Editor**

#### 3.3. Configurar o Storage

1. Vá em **Storage** no menu lateral
2. O bucket `piso-images` já deve ter sido criado pelo script SQL
3. Se não foi criado automaticamente:
   - Clique em **New Bucket**
   - Nome: `piso-images`
   - Marque **Public bucket**
   - File size limit: `5 MB`
   - Allowed MIME types: `image/png, image/jpeg, image/webp, image/gif`

#### 3.4. Criar o primeiro administrador

1. Vá em **Authentication** > **Users**
2. Clique em **Add User** > **Create new user**
3. Informe email e senha
4. Após criar, vá em **Table Editor** > `profiles`
5. Encontre o usuário criado e altere `tipo_usuario` para `admin`

### 4. Configurar variáveis de ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

2. No painel do Supabase, vá em **Settings** > **API**
3. Copie os valores e cole no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 5. Executar localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy na Vercel

### 1. Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: initial commit - Estoque Pisos"
git branch -M main
git remote add origin https://github.com/seu-usuario/estoque-pisos.git
git push -u origin main
```

### 2. Conectar ao Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **New Project**
3. Importe o repositório do GitHub
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua Anon Key
5. Clique em **Deploy**

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/              # Páginas de autenticação
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/         # Páginas protegidas
│   │   ├── layout.tsx       # Layout com sidebar/bottom nav
│   │   ├── page.tsx         # Dashboard
│   │   ├── estoque/         # Lista de estoque
│   │   ├── baixa/           # Dar baixa
│   │   ├── cadastro/        # Cadastro de pisos
│   │   ├── vendedores/      # Vendedores
│   │   ├── mais-vendidos/   # Ranking
│   │   ├── historico/       # Histórico
│   │   └── configuracoes/   # Configurações
│   ├── layout.tsx           # Root layout
│   └── globals.css
├── components/
│   ├── ui/                  # Componentes base reutilizáveis
│   ├── layout/              # Sidebar, BottomNav, Header
│   └── ...                  # Componentes por feature
├── lib/
│   ├── supabase/            # Clients Supabase
│   ├── types/               # Tipos TypeScript
│   ├── services/            # Serviços (CRUD, RPC)
│   ├── utils/               # Utilitários
│   └── hooks/               # Custom hooks
└── middleware.ts             # Proteção de rotas
```

## 🔐 Tipos de Usuário

| Funcionalidade | Administrador | Vendedor |
|---|:---:|:---:|
| Dashboard | ✅ | ✅ |
| Consultar estoque | ✅ | ✅ |
| Pesquisar pisos | ✅ | ✅ |
| Dar baixa | ✅ | ✅ |
| Cadastrar pisos | ✅ | ❌ |
| Editar pisos | ✅ | ❌ |
| Entrada de estoque | ✅ | ❌ |
| Ajuste de estoque | ✅ | ❌ |
| Gerenciar vendedores | ✅ | ❌ |
| Histórico completo | ✅ | Parcial |
| Configurações | ✅ | ❌ |

## 🗃️ Banco de Dados

O sistema utiliza 3 tabelas principais no Supabase:

- **profiles**: Usuários do sistema (linked com auth.users)
- **pisos**: Catálogo de pisos com estoque
- **movimentacoes_estoque**: Histórico de todas as movimentações

Operações de estoque usam funções RPC com `SELECT FOR UPDATE` para atomicidade.

## 📄 Licença

Projeto privado - Todos os direitos reservados.
