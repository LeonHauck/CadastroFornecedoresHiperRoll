<div align="center">

<img src="Novo-Logotipo-HiperRoll.png" alt="Logotipo Hiperroll" width="120">

# Portal de Cadastro de Fornecedores e Clientes

Formulário web em etapas que padroniza o cadastro de fornecedores e clientes da Hiperroll Embalagens:
busca os dados da empresa pelo CNPJ, gera a ficha em PDF e avisa os setores responsáveis por e-mail.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4?logo=php&logoColor=white)
![jsPDF](https://img.shields.io/badge/jsPDF-2.5.1-EC162B)

<br>

<img src="docs/screenshots/etapa-1-dados-cadastrais.png" alt="Tela inicial do portal, na etapa de dados cadastrais" width="820">

</div>

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Telas](#telas)
- [Como funciona](#como-funciona)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuração](#configuração)
- [Executando localmente](#executando-localmente)
- [Publicação](#publicação)
- [Segurança](#segurança)
- [Documentação de apoio](#documentação-de-apoio)
- [Autor](#autor)

## Visão geral

O portal substitui a ficha de cadastro preenchida à mão por um fluxo digital de quatro etapas. Quem preenche informa o CNPJ e recebe razão social, endereço e contatos já preenchidos; ao final, o sistema gera uma ficha em PDF com a identidade visual da empresa e envia os dados por e-mail para os setores que precisam deles (comercial, fiscal, financeiro e logística).

Não há banco de dados nem etapa de build: são arquivos estáticos e um único script PHP que faz a ponte com o serviço de e-mail.

## Funcionalidades

**Preenchimento assistido**

- Busca automática dos dados da empresa pelo CNPJ, com três fontes em cascata: BrasilAPI v1, BrasilAPI v2 e MinhaReceita.
- Preenchimento do endereço pelo CEP, via ViaCEP.
- Máscaras de CNPJ/CPF, CEP e telefone. O campo de CNPJ aceita letras e números, compatível com o CNPJ alfanumérico.
- Atalhos "Sou Isento" (inscrição estadual) e "Mesmo do principal" (e-mails e telefones do financeiro e da logística).
- Campos condicionais, como "Qual Isenção?", que só aparece quando há isenção fiscal.

**Validação**

- Cada etapa só avança com os campos obrigatórios preenchidos e com e-mail e telefone em formato válido. Os campos com problema ficam destacados em vermelho.
- CNPJ não localizado não trava o cadastro: na segunda tentativa, o portal pede confirmação e libera o preenchimento manual.
- A tecla Enter não envia o formulário por acidente.

**Saída do cadastro**

- Ficha de cadastro em PDF gerada no navegador, com o logotipo da empresa, disponível para download na tela de confirmação.
- E-mail em HTML para um ou mais destinatários, com todos os dados e um botão para baixar a ficha.
- Assunto do e-mail com a razão social, para facilitar a busca na caixa de entrada.
- Log de envio no servidor (`error_email.log`) para diagnóstico.

**Dados coletados**

| Etapa | Conteúdo |
| --- | --- |
| 1. Dados cadastrais | Tipo de cadastro, CNPJ/CPF, razão social, nome fantasia, ramo de atividade, regime tributário |
| 2. Localização e contato | CEP, endereço, cidade, UF, telefone, e-mail, representante |
| 3. Financeiro e fiscal | Inscrição estadual, isenções, forma e prazo de pagamento, contatos do financeiro, enquadramento no IBS/CBS |
| 4. Logística | Horários de recebimento, agendamento, tipo de carga, descarga, restrições de veículo, contatos da logística, observações |

## Telas

> As capturas abaixo usam dados fictícios.

### Formulário em quatro etapas

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/etapa-1-dados-cadastrais.png" alt="Etapa 1: dados cadastrais"></td>
    <td width="50%"><img src="docs/screenshots/etapa-2-localizacao-contato.png" alt="Etapa 2: localização e contato"></td>
  </tr>
  <tr>
    <td align="center"><b>1. Dados cadastrais</b><br>Razão social e nome fantasia preenchidos a partir do CNPJ</td>
    <td align="center"><b>2. Localização e contato</b><br>Endereço, telefone e e-mail vindos da consulta</td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/etapa-3-financeiro-fiscal.png" alt="Etapa 3: financeiro e fiscal"></td>
    <td><img src="docs/screenshots/etapa-4-logistica.png" alt="Etapa 4: logística"></td>
  </tr>
  <tr>
    <td align="center"><b>3. Financeiro e fiscal</b><br>Campo de isenção condicional e atalho "Mesmo do principal"</td>
    <td align="center"><b>4. Logística</b><br>Condições de recebimento e observações</td>
  </tr>
</table>

### Validação e CNPJ não encontrado

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/validacao.png" alt="Campos obrigatórios vazios destacados em vermelho, com aviso no canto da tela"></td>
    <td width="50%"><img src="docs/screenshots/cnpj-nao-encontrado.png" alt="Janela perguntando se o CNPJ não localizado está correto"></td>
  </tr>
  <tr>
    <td align="center"><b>Validação por etapa</b><br>Campos pendentes em destaque e aviso no canto da tela</td>
    <td align="center"><b>CNPJ não encontrado</b><br>Confirmação que libera o preenchimento manual</td>
  </tr>
</table>

### Confirmação do envio

<div align="center">
  <img src="docs/screenshots/cadastro-enviado.png" alt="Janela de confirmação com o botão para gerar o PDF do cadastro" width="760">
</div>

### Ficha em PDF e e-mail para a equipe

<table>
  <tr>
    <td width="50%" valign="top"><img src="docs/screenshots/ficha-pdf.png" alt="Primeira página da ficha de cadastro em PDF"></td>
    <td width="50%" valign="top"><img src="docs/screenshots/email.png" alt="E-mail enviado à equipe com os dados do cadastro"></td>
  </tr>
  <tr>
    <td align="center"><b>Ficha de cadastro</b><br>Primeira página do PDF gerado no navegador</td>
    <td align="center"><b>E-mail de notificação</b><br>Dados completos e link para baixar a ficha</td>
  </tr>
</table>

### Versão para celular

<div align="center">
  <img src="docs/screenshots/mobile.png" alt="Portal em tela de celular, com os campos em uma coluna" width="620">
</div>

## Como funciona

```mermaid
sequenceDiagram
    actor U as Fornecedor ou cliente
    participant N as Navegador
    participant A as BrasilAPI, MinhaReceita e ViaCEP
    participant P as send_email.php
    participant S as SMTP Locaweb
    actor E as Equipe Hiperroll

    U->>N: Informa CNPJ e CEP
    N->>A: Consulta os dados
    A-->>N: Razão social, endereço e contatos
    U->>N: Conclui as quatro etapas
    N->>N: Gera a ficha em PDF (jsPDF)
    N->>P: Envia dados e PDF em base64
    P->>P: Salva o PDF em /uploads
    P->>S: Um envio por destinatário
    S-->>E: E-mail com os dados e o link da ficha
    P-->>N: Resultado do envio
    N-->>U: Confirmação e download do PDF
```

Duas decisões explicam o desenho:

- **PDF por link, não por anexo.** A API REST do SMTP Locaweb não aceita anexos no envio por JSON. Por isso o PHP grava o PDF na pasta `uploads/` e inclui no e-mail um botão que aponta para o arquivo.
- **Envio de e-mail no servidor.** O token do serviço de e-mail fica no `.env`, lido apenas pelo PHP, e nunca chega ao navegador.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | HTML5, CSS3 e JavaScript puro, sem framework e sem build |
| Geração de PDF | [jsPDF](https://github.com/parallax/jsPDF) 2.5.1, carregado por CDN |
| Servidor | PHP com cURL, em um único script |
| Dados de empresas | [BrasilAPI](https://brasilapi.com.br/) e [MinhaReceita](https://minhareceita.org/) |
| Endereços | [ViaCEP](https://viacep.com.br/) |
| E-mail | [SMTP Locaweb](https://www.locaweb.com.br/smtp-locaweb/), API REST |

## Estrutura do projeto

```
.
├── index.html                           # Formulário em quatro etapas e janelas de confirmação
├── style.css                            # Identidade visual e layout responsivo
├── script.js                            # Navegação, validação, consultas, máscaras e geração do PDF
├── send_email.php                       # Recebe o cadastro, salva o PDF e dispara os e-mails
├── .env.example                         # Modelo das variáveis de ambiente
├── .htaccess                            # Bloqueia o acesso ao .env e a listagem de diretórios
├── Novo-Logotipo-HiperRoll.png          # Logotipo usado na página e no cabeçalho do PDF
├── cartilha_cadastro_representantes.md  # Guia de preenchimento para representantes
└── docs/screenshots/                    # Imagens deste README
```

Em produção, o servidor cria ainda a pasta `uploads/` (fichas em PDF) e o arquivo `error_email.log`. Esses itens, o `.env` e os scripts de teste com credenciais ficam fora do Git, pelo `.gitignore`.

## Configuração

Copie o modelo e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `SMTP_TOKEN` | Sim | Token da API do SMTP Locaweb |
| `SMTP_REMETENTE` | Sim | E-mail remetente, autorizado na conta do SMTP Locaweb |
| `SMTP_DESTINATARIO` | Não | Quem recebe os cadastros. Aceita vários endereços separados por vírgula. Padrão: `grupocomercial@hiperroll.com.br` |
| `SMTP_ASSUNTO` | Não | Assunto do e-mail; a razão social é acrescentada ao final. Padrão: `Novo Cadastro - Portal Hiperroll` |

## Executando localmente

Requisitos: PHP 7.4 ou superior com a extensão cURL habilitada.

```bash
git clone https://github.com/LeonHauck/CadastroFornecedoresHiperRoll.git
cd CadastroFornecedoresHiperRoll
cp .env.example .env    # preencha o token e o remetente
php -S localhost:8000
```

Abra <http://localhost:8000> no navegador.

Para ver apenas a interface, basta abrir o `index.html` direto no navegador. As consultas de CNPJ e CEP e o PDF funcionam; o envio do e-mail não, porque depende do PHP.

## Publicação

1. Envie os arquivos para uma hospedagem com Apache e PHP (HostGator, Locaweb ou similar).
2. Envie também o `.env` preenchido. Arquivos iniciados por ponto costumam ficar ocultos no gerenciador de arquivos da hospedagem, então confira se ele chegou ao servidor.
3. Garanta permissão de escrita na pasta do projeto, para que o PHP crie `uploads/` e `error_email.log`.
4. Faça um cadastro de teste e confira o recebimento do e-mail. Se não chegar, o motivo estará em `error_email.log`.

A pasta `docs/` não precisa ir para o servidor, e scripts de teste com credenciais não devem ser enviados.

## Segurança

- O `.htaccess` bloqueia o acesso direto ao `.env` e ao `.env.example` e desativa a listagem de diretórios. Essa proteção vale para Apache; em outro servidor, configure o bloqueio equivalente.
- O token do serviço de e-mail é lido apenas pelo PHP e não aparece no código enviado ao navegador.
- Credenciais não são versionadas: o `.env` e os scripts de teste que contêm token estão no `.gitignore`.
- As fichas em `uploads/` ficam acessíveis a quem tiver o link, e os links não expiram. A pasta não é listável, mas vale apagar os arquivos antigos periodicamente.

## Documentação de apoio

A [cartilha de cadastro](cartilha_cadastro_representantes.md) explica o preenchimento campo a campo e pode ser repassada a representantes e novos usuários do portal.

## Autor

Desenvolvido por [Leon Hauck](https://www.linkedin.com/in/leon-hauck/).
