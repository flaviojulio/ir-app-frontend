# TaxStock - Gestão de IR sobre Ações

Sistema completo para gestão de imposto de renda sobre operações com ações, com interface mobile-first e UX simplificada.

## 🚀 Funcionalidades

- **Dashboard Intuitivo**: Visão geral da carteira e medidor de IR
- **Upload de Operações**: Importação via arquivo JSON
- **Cálculo Automático**: IR, DARFs e operações fechadas
- **Gamificação**: Sistema de conquistas e badges
- **Mobile-First**: Design otimizado para dispositivos móveis
- **Autenticação JWT**: Sistema seguro de login

## 📊 Formato do Arquivo JSON

O sistema aceita arquivos JSON com o seguinte formato:

\`\`\`json
[
  {
    "date": "2025-01-10",
    "ticker": "ITUB4",
    "operation": "buy",
    "quantity": 1000,
    "price": 19.0,
    "fees": 2.0
  },
  {
    "date": "2025-01-15",
    "ticker": "PETR4",
    "operation": "sell",
    "quantity": 500,
    "price": 28.75,
    "fees": 1.5
  }
]
\`\`\`

### Campos Obrigatórios:
- **date**: Data da operação (YYYY-MM-DD)
- **ticker**: Código do ativo (ex: ITUB4, PETR4)
- **operation**: Tipo de operação ("buy" ou "sell")
- **quantity**: Quantidade de ações (número positivo)
- **price**: Preço por ação (número positivo)
- **fees**: Taxas da operação (número não negativo)

## 🛠️ Instalação

### Backend (FastAPI)
\`\`\`bash
cd backend
pip install -r requirements.txt
python main.py
\`\`\`

### Frontend (Next.js)
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## 🔐 Acesso Demo

- **Usuário**: admin
- **Senha**: admin123

## 📱 Tecnologias

### Backend
- FastAPI
- SQLite
- JWT Authentication
- Pydantic

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

## 🎯 Principais Recursos

1. **Autenticação Segura**: Sistema JWT com refresh tokens
2. **Upload Inteligente**: Validação e processamento de arquivos JSON
3. **Cálculos Precisos**: IR, swing trade, day trade
4. **Interface Responsiva**: Mobile-first com UX simplificada
5. **Gamificação**: Conquistas e progresso do usuário
6. **Relatórios**: DARFs e operações fechadas

## 📈 APIs Disponíveis

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/registrar` - Registro de novo usuário
- `GET /api/auth/me` - Dados do usuário atual

### Operações
- `POST /api/upload` - Upload de arquivo JSON
- `GET /api/operacoes` - Listar operações
- `GET /api/operacoes/fechadas` - Operações fechadas

### Portfolio
- `GET /api/carteira` - Carteira atual
- `GET /api/resultados` - Resultados mensais
- `GET /api/darfs` - DARFs pendentes

## 🔧 Configuração

Crie um arquivo `.env.local` no frontend:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.
