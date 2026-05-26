# 🚀 Portal de Cadastro de Fornecedores - Hiperroll

Uma aplicação web robusta e moderna desenvolvida para automatizar e padronizar o processo de onboarding de novos fornecedores e clientes da Hiperroll. O sistema substitui formulários manuais por um fluxo digital inteligente, com validação de dados em tempo real, geração automatizada de documentos e integração com mensageria corporativa.

## ✨ Funcionalidades Principais

- **UX/UI Otimizada:** Formulário dinâmico dividido em etapas (Wizard) com design responsivo.
- **Integração de APIs Brasileiras:**
  - **BrasilAPI / MinhaReceita:** Busca automática de dados empresariais a partir do CNPJ, com fallback de segurança para garantir estabilidade.
  - **ViaCEP:** Preenchimento automático de endereço via CEP.
- **Geração Dinâmica de PDF:** Utiliza a biblioteca `jsPDF` para compilar todos os dados preenchidos em uma "Ficha de Cadastro" profissional com o branding da empresa.
- **Mensageria Transacional:** Back-end em PHP integrado com a API REST **SMTPLW (Locaweb)** para disparo automático de e-mails para os setores responsáveis (Comercial, Fiscal, Logística, etc), contendo um link para download da ficha em anexo.
- **Segurança:** Proteção de credenciais de e-mail e tokens de API através de variáveis de ambiente (`.env`).

## 🛠️ Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3, JavaScript (Vanilla).
- **Bibliotecas:** jsPDF (Geração de documentos client-side).
- **Back-end:** PHP 8+ (Processamento e comunicação de API de e-mail via cURL).
- **APIs Externas:** SMTPLW (Locaweb), ViaCEP, BrasilAPI.

## ⚙️ Como Executar o Projeto

1. Clone este repositório.
2. Configure o ambiente:
   - Crie um arquivo `.env` baseado no `.env.example`.
   - Insira o seu Token da API SMTPLW (Locaweb) e as configurações de remetente/destinatário.
3. Hospedagem:
   - Hospede os arquivos em um servidor Apache/Nginx com suporte a PHP (ex: HostGator, Locaweb, AWS).
   - O servidor precisa ter permissão de escrita na raiz do projeto para que a pasta `/uploads` seja criada automaticamente (onde os PDFs serão salvos temporariamente para envio).

## 💡 Sobre o Desenvolvimento

Este projeto foi desenvolvido focado na experiência do usuário e na resiliência do sistema. Um dos maiores desafios foi contornar bloqueios de CORS e limitações de APIs de e-mail, resolvidos com sucesso ao arquitetar um micro-backend em PHP que gerencia o armazenamento local de relatórios em PDF e despacha requisições autenticadas para o serviço SMTP corporativo.
