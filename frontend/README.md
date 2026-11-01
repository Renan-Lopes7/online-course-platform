# Frontend da plataforma de cursos

Frontend separado do backend, criado com Next.js 15, React 19 e TypeScript. A identidade exibida é Cursos de Barber Stone. A interface mantém a direção visual editorial escura com acentos laranja. Os elementos gráficos do catálogo são ilustrações CSS decorativas; os dados comerciais são carregados da API.

## Executar localmente

1. Use uma versão LTS recente do Node.js.
2. Copie `.env.example` para `.env.local` e configure `NEXT_PUBLIC_API_URL` (por padrão, `http://localhost:3000`). Não coloque chaves privadas nessa variável.
3. Na pasta do frontend, execute `npm install` e `npm run dev`.
4. Acesse `http://localhost:3001`. O script `dev` já inicia o Next nessa porta.

O NestJS precisa estar ativo na URL configurada. O backend analisado não habilita CORS em `src/main.ts`; autorize a origem `http://localhost:3001` no NestJS para desenvolvimento e a origem publicada em produção. Não desative CORS. A aplicação não usa proxy próprio: o navegador conversa com a API NestJS.

## Fluxos implementados

- Início, catálogo e detalhes: `GET /curso` e `GET /curso/:id`.
- Cadastro: `POST /user`, com nome (até 100 caracteres), e-mail (até 254) e senha (8–72 caracteres).
- Login/logout: `POST /auth/signin`; JWT guardado apenas em `sessionStorage` e enviado como Bearer nas rotas protegidas. Encerrar sessão remove o token. A role lida do token controla apenas a navegação; a API permanece responsável pela autorização.
- Área do aluno: `GET /compra`; mostra status `PENDENTE`, `PAGO` e `CANCELADO`. Compras pagas apontam para as aulas.
- Matrícula e Pix: `POST /compra/:cursoId`, `POST /asaas/compra/:compraId/pix` e `GET /asaas/compra/:compraId/pix/qrcode`. O preço é definido pelo backend. O CPF é mantido somente no campo transitório do formulário e enviado no corpo como `cpfCnpj`; não é salvo em armazenamento do navegador, URL ou logs da interface.
- Estado de pagamento: `GET /compra/:id` consultado periodicamente enquanto estiver pendente. O frontend não muda status por conta própria; o webhook valida o evento e consulta o Asaas antes de marcar a compra como paga. A tela de acesso só aparece após o status `PAGO` retornado pela API.
- Aulas: `GET /cursos/:cursoId/aulas` exige JWT e compra paga; `GET /aulas/:id` tem a mesma validação de acesso. Qualquer tentativa sem autorização é mostrada conforme o erro HTTP.
- Administração: CRUD de cursos e criação/edição/exclusão de aulas pelos endpoints existentes. A API aplica `AuthGuard` e `AdminGuard`; o bloqueio visual por role é apenas conveniência.

## Limitações reais da API

- **Videas:** o DTO chama `videoUrl` de ID do vídeo e a API só armazena/devolve essa string. Não há integração ou formato de player identificável no código. A área autenticada lista aulas e seleciona seus títulos, mas mantém o player em estado informativo; não inventa URL ou iframe. Confirme com o Videas o formato/SDK e a forma de entrega segura antes de ativar reprodução.
- **Pagamento:** a consulta periódica lê `GET /compra/:id`, que reflete a compra atualizada pelo webhook. Isso depende do webhook estar configurado e acessível no Asaas. Não há consulta de status diretamente pelo endpoint público da plataforma. A UI distingue compra pendente, paga e cancelada com base no banco da plataforma, sem interpretar a resposta do cliente como confirmação.
- **Gestão de aulas:** não existe listagem administrativa independente. O endpoint de listagem exige uma compra paga; por isso, o painel permite criar aulas e editar/excluir por ID informado, mas não enumera todas as aulas. Ajuste mínimo sugerido: uma rota de listagem administrativa protegida por `AuthGuard` + `AdminGuard`.
- **Conta:** não existe rota `GET /me` ou `GET /user/:id` para obter dados do usuário autenticado. O frontend não exibe nem edita perfil; para isso, exponha uma rota de perfil derivada de `req.user.sub`.
- **CORS:** habilitar explicitamente as origens de frontend de desenvolvimento/publicação no NestJS.

## Verificações

- `npx tsc --noEmit` — passou.
- `npm run lint` — passou.
- `npm run build` — passou sem avisos.
- Revisão visual no navegador local: a página inicial renderiza, o catálogo mostra o estado de API indisponível quando NestJS está parado e `/aluno` redireciona para login sem sessão.

Essas verificações não representam teste de integração com banco/API nem pagamento real. A API NestJS não estava ativa durante a revisão visual; por isso, não foi possível verificar cadastro, login contra o banco, criação de cobrança, webhook, aulas ou permissões com dados reais. Nenhuma compra ou confirmação foi simulada. Para testar Asaas Sandbox, configure as credenciais exclusivamente no backend, webhook e CORS; gere um usuário e curso de teste no próprio backend. Um pagamento somente será confirmado pelo fluxo real do webhook.
