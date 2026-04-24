# Guia de Deploy - Frontend no AWS ECS

Este guia explica como usar o GitHub Actions para fazer CI/CD do `atelier-frontend` para o AWS ECS (Fargate), usando a imagem Docker gerada a partir do build do Vite.

> **Importante:** este setup é um template inicial. Você PRECISA ajustar nomes de recursos, ARNs e secrets antes do primeiro deploy.

---

## 1. Visão geral do fluxo

1. Push na branch `main` (ou disparo manual via _workflow dispatch_).
2. GitHub Actions:
   - roda `npm ci`, `npm run lint` e `npm run build`;
   - cria uma imagem Docker usando o `Dockerfile` na raiz do projeto;
   - faz push da imagem para o Amazon ECR;
   - atualiza a task definition do ECS com a nova imagem;
   - faz deploy no serviço ECS configurado.

---

## 2. Arquivos criados/alterados

- **`Dockerfile`**
  - Usa `nginx:alpine` para servir os arquivos estáticos gerados pelo Vite.
  - Copia a pasta `dist/` (gerada por `npm run build`) para `/usr/share/nginx/html`.
- **`nginx.conf`**
  - Configuração do Nginx para SPA:
    - `try_files $uri $uri/ /index.html;` garante fallback para `index.html` em rotas do React Router.
- **`ecs-task-def.json`**
  - Template de task definition para ECS Fargate.
  - A imagem é substituída automaticamente pelo GitHub Actions.
  - Contém placeholders que você precisa ajustar (ARNs, região, etc.).
- **`.github/workflows/frontend-ecs-ci-cd.yml`**
  - Workflow de CI/CD:
    - build + lint;
    - build/push da imagem para ECR;
    - deploy no ECS.

---

## 3. Ajustes necessários no AWS

### 3.1. Criar repositório ECR

1. Acesse o console do **ECR**.
2. Crie um repositório:
   - **Nome sugerido:** `atelier-frontend`
   - Se usar outro nome, atualize a env `ECR_REPOSITORY` no workflow:
     - Arquivo: `.github/workflows/frontend-ecs-ci-cd.yml`
     - Chave: `ECR_REPOSITORY`

### 3.2. Criar cluster e serviço ECS (Fargate)

1. No console do **ECS**, crie um **Cluster**:
   - **Nome sugerido:** `atelier-frontend-cluster`
   - Tipo: Fargate (serverless).
2. Crie um **Service**:
   - **Nome sugerido:** `atelier-frontend-service`
   - Tipo de lançamento: Fargate.
   - Task definition:
     - Família: `atelier-frontend-task` (vai usar o template `ecs-task-def.json`).
   - Número de tasks: comece com 1.
   - Configuração de rede:
     - `awsvpc`, subnets públicas.
     - Anexar um Security Group permitindo HTTP (porta 80) do mundo externo ou do Load Balancer.
   - (Opcional, mas recomendado) Configure um **Application Load Balancer** na frente do serviço.

> Você pode inicialmente registrar a task definition manualmente (copiando o JSON ajustado) e apontar o service para ela. Depois o GitHub Actions passa a atualizar essa mesma task definition.

### 3.3. Roles (IAM) da task ECS

No arquivo `ecs-task-def.json` há placeholders:

- `"executionRoleArn": "REPLACE_ME_EXECUTION_ROLE_ARN"`
- `"taskRoleArn": "REPLACE_ME_TASK_ROLE_ARN"`
- Em `logConfiguration.options.awslogs-region`: `"REPLACE_ME_REGION"`

Você precisa:

1. Criar (ou reutilizar) uma **execution role** do ECS para Fargate:
   - Tipicamente com a policy gerenciada `AmazonECSTaskExecutionRolePolicy`.
   - Copiar o ARN e colocar em `executionRoleArn`.
2. (Opcional) Criar uma **task role** específica se o container precisar acessar outros serviços AWS via SDK:
   - Caso não precise, pode criar uma role básica ou usar uma existente.
   - Colocar o ARN em `taskRoleArn`.
3. Atualizar `"REPLACE_ME_REGION"` com sua região (ex.: `us-east-1`).

---

## 4. Configuração de credenciais no GitHub (OIDC + IAM)

O workflow usa **OIDC** para assumir uma role no AWS (mais seguro que access key/secret).

### 4.1. Criar role IAM para o GitHub

1. No console do **IAM**, crie uma **Role**:
   - Tipo de entidade confiável: `Web identity`.
   - Provedor de identidade: `GitHub`.
2. Defina as **trust relationships** para permitir que o repositório assuma essa role (seguir doc oficial da AWS/GitHub).
3. Anexe policies com permissões:
   - ECR: `ecr:BatchCheckLayerAvailability`, `ecr:CompleteLayerUpload`, `ecr:DescribeRepositories`, `ecr:GetAuthorizationToken`, `ecr:InitiateLayerUpload`, `ecr:PutImage`, etc.
   - ECS: `ecs:DescribeServices`, `ecs:DescribeTaskDefinition`, `ecs:RegisterTaskDefinition`, `ecs:UpdateService`, etc.
   - Logs: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`.
4. Copie o **ARN** da role criada (ex.: `arn:aws:iam::<ACCOUNT_ID>:role/github-actions-atelier-frontend`).

### 4.2. Adicionar secret no GitHub

No repositório no GitHub:

1. Vá em **Settings → Secrets and variables → Actions → New repository secret**.
2. Crie:
   - `AWS_GITHUB_ROLE_ARN` = ARN da role criada acima.
   - `VITE_API_URL` = URL pública do backend (ex.: `https://api.seu-dominio.com`).

> O `VITE_API_URL` será injetado como variável de ambiente durante o `npm run build`, e o Vite usará isso em `import.meta.env.VITE_API_URL`.

---

## 5. Ajustes no workflow (`frontend-ecs-ci-cd.yml`)

Arquivo: `.github/workflows/frontend-ecs-ci-cd.yml`

### 5.1. Regiões e nomes de recursos

No bloco `env` do workflow:

- **`AWS_REGION`**: ajuste para a região onde estão ECR/ECS (ex.: `us-east-1`, `sa-east-1`).
- **`ECR_REPOSITORY`**: nome do repositório que você criou no ECR.
- **`ECS_CLUSTER`**: nome do cluster ECS.
- **`ECS_SERVICE`**: nome do service ECS.
- **`CONTAINER_NAME`**: deve bater com o `name` em `ecs-task-def.json` (`atelier-frontend` por padrão).

### 5.2. Branch de deploy

Por padrão:

```yaml
on:
  push:
    branches:
      - main
```

Se quiser outra branch (ex.: `production`), altere esse trecho.

### 5.3. Ambiente de build (`VITE_API_URL`)

No topo do workflow:

- `VITE_API_URL: ${{ secrets.VITE_API_URL }}`

Você pode:

- Usar secrets diferentes para dev/stage/prod (ex.: `VITE_API_URL_PROD`) e trocar conforme o job.
- Adicionar variáveis de ambiente extras se o frontend passar a usar outras `VITE_*`.

---

## 6. Como o deploy funciona em detalhes

1. **Checkout, Node, build**
   - `actions/checkout@v4`
   - `actions/setup-node@v4` com Node 20.
   - `npm ci`
   - `npm run lint`
   - `npm run build` (gera `dist/` com `VITE_API_URL` vindo do secret).

2. **Docker + ECR**
   - `aws-actions/configure-aws-credentials@v4` assume a role AWS via OIDC.
   - `aws-actions/amazon-ecr-login@v2` faz login no ECR.
   - `docker build` usa o `Dockerfile` da raiz:
     - Copia `nginx.conf`.
     - Copia a pasta `dist/` gerada no passo de build.
   - `docker push` envia a imagem para o repositório ECR.

3. **ECS**
   - `aws-actions/amazon-ecs-render-task-definition@v1`:
     - Lê `ecs-task-def.json`.
     - Substitui o campo `image` do container `atelier-frontend` pela imagem nova do ECR.
   - `aws-actions/amazon-ecs-deploy-task-definition@v2`:
     - Registra a nova task definition.
     - Atualiza o serviço ECS informado (`ECS_SERVICE`) para usar a nova revisão.
     - Aguarda estabilidade do serviço.

---

## 7. O que você provavelmente vai querer mudar depois

- **Nomes de recursos**:
  - Cluster, service, família da task, repositório ECR.
- **Tamanho da task**:
  - `cpu` e `memory` em `ecs-task-def.json` (ex.: `512`/`1024` se precisar de mais recursos).
- **Região AWS**:
  - `AWS_REGION` no workflow.
  - `"awslogs-region"` em `ecs-task-def.json`.
- **Integração com backend**:
  - Valor de `VITE_API_URL` (provavelmente para o domínio HTTPS do backend na AWS).
- **Infra de rede**:
  - Uso de Load Balancer, HTTPS via ACM/ALB, regras de Security Group.
- **Ambientes múltiplos**:
  - Separar workflows/serviços para `staging` e `production`.

---

## 8. Como testar o fluxo

1. Confirme que:
   - Repositório ECR existe.
   - Cluster e service ECS existem e estão saudáveis.
   - Role IAM para GitHub (OIDC) está criada.
   - Secrets `AWS_GITHUB_ROLE_ARN` e `VITE_API_URL` estão configurados.
   - `ecs-task-def.json` tem ARNs e região corretos.
2. Faça um commit na branch `main` (ou rode o workflow manualmente em **Actions** → `Frontend CI/CD - ECS` → `Run workflow`).
3. Acompanhe os logs do job:
   - Se falhar em login no AWS/ECR, revisar role e trust policy.
   - Se falhar no deploy ECS, revisar nomes de cluster/service e permissões IAM.
4. Após sucesso, acesse o endpoint do serviço/Load Balancer para validar o frontend.

---

## 9. Próximos passos recomendados

- Configurar HTTPS (ACM + ALB ou CloudFront).
- Criar um ambiente de `staging` com outro serviço ECS e outro repositório/branch.
- Integrar monitoramento (CloudWatch dashboards, alarms).

