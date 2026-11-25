# Plataforma de Cursos de Barbearia

<p align="center">
  <strong>Formação online • Barbearia</strong>
</p>

<p align="center">
  Uma plataforma digital para comercialização e gerenciamento de cursos online de barbearia.
</p>

---

## Sobre o projeto

A plataforma de cursos online desenvolvida para oferecer uma experiência digital de comercialização e gerenciamento de treinamentos na área de barbearia.

A aplicação possui frontend e backend separados, permitindo o gerenciamento de usuários, cursos, aulas e compras, além do controle de acesso ao conteúdo conforme a confirmação dos pagamentos.

O projeto foi desenvolvido com foco em boas práticas de desenvolvimento, arquitetura backend, integração de serviços externos, segurança e implantação em ambiente de nuvem.

## Demonstração

**Plataforma online:**

https://online-course-platform-1-z6a2.onrender.com

**API Backend:**

https://online-course-platform-scgs.onrender.com

> Algumas integrações ainda estão em preparação para operação em produção.

## Funcionalidades

- Cadastro e autenticação de usuários.
- Autenticação utilizando JWT.
- Controle de acesso por perfil (Administrador e aluno).
- Gerenciamento de cursos.
- Cadastro, edição e exclusão de aulas.
- Gerenciamento de compras.
- Integração com pagamentos PIX através do Asaas.
- Recebimento de notificações de pagamento por Webhook.
- Atualização automática do status das compras.
- Liberação de aulas após confirmação do pagamento.
- Integração com serviço externo de hospedagem de vídeos.
- Área administrativa para gerenciamento da plataforma.

## Tecnologias utilizadas

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- MySQL

### Frontend

- Next.js
- React
- TypeScript
- CSS

### Banco de dados e infraestrutura

- TiDB Cloud — banco de dados em nuvem compatível com MySQL.
- Render — hospedagem do frontend e backend.
- Docker — ambiente de desenvolvimento.
- Git e GitHub — versionamento de código.

### Integrações externas

- Asaas — processamento de pagamentos PIX.
- Videas — hospedagem de vídeos.

## Arquitetura do projeto

A aplicação utiliza uma arquitetura separada entre frontend e backend, permitindo a organização das responsabilidades e a comunicação através de uma API REST.

| Camada | Responsabilidade |
|---|---|
| Frontend | Interface e interação com os usuários |
| Backend | Regras de negócio, autenticação e gerenciamento dos dados |
| Banco de dados | Persistência de usuários, cursos, aulas e compras |
| Asaas | Processamento de pagamentos |
| Videas | Hospedagem e disponibilização de vídeos |

## Integração de pagamentos

A plataforma utiliza o Asaas para processamento de pagamentos via PIX.

O backend é responsável por criar as cobranças e receber notificações de alteração de status através de Webhooks.

Quando um pagamento é confirmado, o sistema atualiza o status da compra e permite que o aluno acesse o conteúdo adquirido.

A integração foi desenvolvida e testada em ambiente Sandbox, com preparação para utilização em produção.

## Segurança

O projeto implementa recursos voltados à proteção das informações e ao controle de acesso:

- Autenticação baseada em JWT.
- Proteção de rotas utilizando Guards do NestJS.
- Controle de permissões por perfil de usuário.
- Validação de dados utilizando DTOs e ValidationPipe.
- Restrição de acesso às aulas conforme o status da compra.
- Utilização de variáveis de ambiente para configurações sensíveis.
- Integração com serviço externo para disponibilização de vídeos.

## Hospedagem e domínio

Atualmente, a plataforma está hospedada na Render, enquanto o banco de dados utiliza a infraestrutura da TiDB Cloud.

Os endereços atuais utilizam o domínio disponibilizado pela Render.

## Executando o projeto localmente

### Pré-requisitos

- Node.js
- npm
- Git
- MySQL ou banco compatível

### 1. Clonar o repositório

```bash
git clone https://github.com/Renan-Lopes7/online-course-platform.git
```

### 2. Acessar a pasta do projeto

```bash
cd online-course-platform
```

### 3. Configurar o backend

Instalar as dependências:

```bash
npm install
```

Configurar as variáveis de ambiente conforme o arquivo `.env.example`.

Gerar o Prisma Client:

```bash
npx prisma generate
```

Iniciar o backend:

```bash
npm run start:dev
```

### 4. Configurar o frontend

Acessar a pasta:

```bash
cd frontend
```

Instalar as dependências:

```bash
npm install
```

Configurar o endereço da API no arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Iniciar o frontend:

```bash
npm run dev
```

A aplicação estará disponível no endereço local informado pelo Next.js.

## Objetivo e aprendizado

O desenvolvimento da STONE representa a aplicação prática de conhecimentos em desenvolvimento de software, com foco especial em backend utilizando Node.js, NestJS e TypeScript.

Durante o desenvolvimento foram trabalhados conceitos como:

- Construção de APIs REST.
- Arquitetura de aplicações backend.
- Modelagem e persistência de dados.
- Autenticação e autorização.
- Integração com APIs externas.
- Processamento de pagamentos.
- Comunicação através de Webhooks.
- Controle de acesso baseado em regras de negócio.
- Deploy e configuração de serviços em nuvem.

## Autor

**Renan Lopes**

- LinkedIn: https://www.linkedin.com/

---

<p align="center">
  Desenvolvido com dedicação e foco em tecnologia.
</p>
