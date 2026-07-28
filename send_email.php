<?php
/**
 * PHP Bridge para envio de e-mails via API SMTP Locaweb
 * Hiperroll Fornecedores
 */

header('Content-Type: application/json');

// 1. FUNÇÃO PARA CARREGAR O ARQUIVO .ENV
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            putenv(trim($parts[0]) . "=" . trim($parts[1]));
            $_ENV[trim($parts[0])] = trim($parts[1]);
        }
    }
}

loadEnv(__DIR__ . '/.env');

// 2. CONFIGURAÇÕES (Lendo do .env ou usando padrão)
$config = [
    'destinatario' => getenv('SMTP_DESTINATARIO') ?: 'grupocomercial@hiperroll.com.br',
    'remetente'    => getenv('SMTP_REMETENTE'),
    'token'        => getenv('SMTP_TOKEN'),
    'assunto'      => getenv('SMTP_ASSUNTO') ?: 'Novo Cadastro - Portal Hiperroll',
];

// 2. CAPTURA OS DADOS ENVIADOS PELO JAVASCRIPT
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// FUNÇÃO DE LOG PARA DEBUG NO SERVIDOR (HOSTGATOR)
function logError($msg) {
    file_put_contents(__DIR__ . '/error_email.log', date('Y-m-d H:i:s') . " - " . $msg . PHP_EOL, FILE_APPEND);
}

if (!$data) {
    logError("Falha: Nenhum dado recebido pelo PHP (Corpo da requisição vazio).");
    echo json_encode(['success' => false, 'message' => 'Nenhum dado recebido.']);
    exit;
}

if (empty($config['token'])) {
    logError("Falha: Token da Locaweb não encontrado! Verifique se o arquivo .env foi enviado para a HostGator.");
}

// 3. FORMATA O CONTEÚDO DO E-MAIL (HTML)
$corpoEmail = "
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .header { background: #EC162B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .container { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .content { padding: 20px; }
        .section { margin-top: 20px; border-bottom: 2px solid #EC162B; padding-bottom: 5px; color: #20236D; font-weight: bold; text-transform: uppercase; }
        .field { margin: 10px 0; border-bottom: 1px solid #eee; padding-bottom: 5px; display: grid; grid-template-columns: minmax(190px, 260px) 1fr; column-gap: 12px; align-items: baseline; }
        .label { font-weight: bold; color: #555; display: block; word-break: break-word; white-space: normal; }
        .value { color: #000; display: block; word-break: break-word; white-space: normal; }
        .footer { background: #f9f9f9; padding: 15px; font-size: 12px; text-align: center; color: #888; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Nova Ficha de Cadastro</h1>
            <p>Portal de Fornecedores Hiperroll</p>
        </div>
        <div class='content'>
            <div class='section'>1. DADOS CADASTRAIS</div>
            <div class='field'><span class='label'>Tipo:</span> <span class='value'>" . ($data['tipoCadastro'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Razão Social:</span> <span class='value'>" . ($data['razaoSocial'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Nome Fantasia:</span> <span class='value'>" . ($data['nomeFantasia'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>CNPJ/CPF:</span> <span class='value'>" . ($data['cnpj'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Ramo de Atividade:</span> <span class='value'>" . ($data['ramo'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Regime Tributário:</span> <span class='value'>" . ($data['regimeTributario'] ?? 'N/A') . "</span></div>

            <div class='section'>2. LOCALIZAÇÃO E CONTATO</div>
            <div class='field'><span class='label'>CEP:</span> <span class='value'>" . ($data['cep'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Endereço:</span> <span class='value'>" . ($data['logradouro'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Cidade/UF:</span> <span class='value'>" . ($data['cidade'] ?? 'N/A') . " - " . ($data['estado'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Telefone Principal:</span> <span class='value'>" . ($data['telefone'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>E-mail Principal:</span> <span class='value'>" . ($data['email'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Representante:</span> <span class='value'>" . ($data['representante'] ?? 'N/A') . "</span></div>

            <div class='section'>3. FINANCEIRO E FISCAL</div>
            <div class='field'><span class='label'>I.E:</span> <span class='value'>" . ($data['inscricaoEstadual'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Isenção Fiscal:</span> <span class='value'>" . ($data['isencaoFiscal'] ?? 'N/A') . " (" . ($data['qualIsencao'] ?? 'N/A') . ")</span></div>
            <div class='field'><span class='label'>Forma Pagto:</span> <span class='value'>" . ($data['formaPagamento'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Cliente paga boleto de Terceiros?</span> <span class='value'>" . ($data['clientePagaBoletos'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Boleto anexado a NF?</span> <span class='value'>" . ($data['boletoAnexadoNF'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Prazo:</span> <span class='value'>" . ($data['prazoPagamento'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>E-mail Fin.:</span> <span class='value'>" . ($data['emailFinanceiro'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Tel. Fin.:</span> <span class='value'>" . ($data['telefoneFinanceiro'] ?? 'N/A') . "</span></div>

            <div class='section'>4. LOGÍSTICA</div>
            <div class='field'><span class='label'>Recebimento NF:</span> <span class='value'>" . ($data['horarioNF'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Recebimento Mercadoria:</span> <span class='value'>" . ($data['horarioMercadoria'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Agendamento?</span> <span class='value'>" . ($data['agendamento'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Tipo de Carga:</span> <span class='value'>" . ($data['tipoCarga'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>E-mail Log.:</span> <span class='value'>" . ($data['emailLogistico'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Tel. Log.:</span> <span class='value'>" . ($data['telefoneLogistico'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Pagamento Descarga?</span> <span class='value'>" . ($data['pagamentoDescarga'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Necessita Chapa?</span> <span class='value'>" . ($data['necessidadeChapa'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Restrições Veículo?</span> <span class='value'>" . ($data['restricoesVeiculo'] ?? 'N/A') . "</span></div>
            <div class='field'><span class='label'>Carga Terceiros?</span> <span class='value'>" . ($data['acessoTerceiros'] ?? 'N/A') . "</span></div>
            
            <div class='section'>OBSERVAÇÕES</div>
            <div style='padding: 10px; background: #f5f5f5; border-radius: 4px;'>" . nl2br($data['observacoes'] ?? 'Nenhuma') . "</div>
        </div>
        <div class='footer'>
            Este e-mail foi gerado automaticamente pelo sistema de cadastro Hiperroll.
        </div>
    </div>
</body>
</html>
";

// 4. TRATAMENTO DO ANEXO (PDF)
// Como a API REST da Locaweb (SMTPLW) não suporta o envio de anexos nativamente via JSON,
// nós salvamos o arquivo no servidor e criamos um link de download no corpo do e-mail.
if (!empty($data['pdfAttachment']) && !empty($data['pdfName'])) {
    $uploadDir = __DIR__ . '/uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // Gera um nome único
    $fileName = time() . '_' . preg_replace('/[^a-zA-Z0-9_.-]/', '', $data['pdfName']);
    $filePath = $uploadDir . '/' . $fileName;
    
    // Salva o arquivo no servidor
    file_put_contents($filePath, base64_decode($data['pdfAttachment']));
    
    // Monta o link para o arquivo
    $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
    $domain = $_SERVER['HTTP_HOST'];
    $baseDir = rtrim(dirname($_SERVER['REQUEST_URI']), '/');
    $fileUrl = $protocol . "://" . $domain . $baseDir . "/uploads/" . $fileName;
    
    // Cria a seção HTML para o botão de download
    $linkAnexo = "
            <div class='section'>FICHA EM PDF</div>
            <div style='padding: 15px; background: #eaf4ff; border-radius: 4px; text-align: center; margin-bottom: 20px;'>
                <p style='margin-bottom: 15px; color: #20236D;'>A ficha de cadastro completa foi gerada em PDF e está disponível para download no link abaixo:</p>
                <a href='{$fileUrl}' style='display: inline-block; padding: 10px 20px; background: #EC162B; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;'>📥 Baixar Ficha PDF</a>
            </div>";
            
    // Insere no corpo do email
    $corpoEmail = str_replace("</div>\n        <div class='footer'>", $linkAnexo . "\n        </div>\n        <div class='footer'>", $corpoEmail);
}

// 5. ENVIO VIA API REST LOCAWEB (SMTPLW)
$listaDestinatarios = explode(',', $config['destinatario']);
$listaDestinatarios = array_map('trim', $listaDestinatarios);

$successCount = 0;
$lastError = '';
$lastHttpCode = 0;

$assuntoDinamico = $config['assunto'];
if (!empty($data['razaoSocial'])) {
    $assuntoDinamico .= " - " . $data['razaoSocial'];
}

foreach ($listaDestinatarios as $destinatario) {
    if (empty($destinatario)) continue;

    $payload = [
        'subject' => $assuntoDinamico,
        'body'    => $corpoEmail,
        'from'    => $config['remetente'],
        'to'      => $destinatario // O SMTPLW exige que seja uma STRING, não um array.
    ];

    $ch = curl_init('https://api.smtplw.com.br/v1/messages');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'x-auth-token: ' . $config['token']
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if (curl_errno($ch)) {
        logError("Falha no cURL para $destinatario: " . curl_error($ch));
    }

    curl_close($ch);

    if ($httpCode >= 200 && $httpCode < 300) {
        $successCount++;
        logError("Sucesso no envio para: " . $destinatario);
    } else {
        $lastError = $response;
        $lastHttpCode = $httpCode;
        logError("Falha da API Locaweb para $destinatario (HTTP $httpCode): " . $response);
    }
}

if ($successCount > 0) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'Erro no envio via Locaweb (Status: ' . $lastHttpCode . ')',
        'details' => $lastError
    ]);
}
?>
