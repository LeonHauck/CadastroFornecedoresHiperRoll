document.addEventListener('DOMContentLoaded', () => {
    const cnpjInput = document.getElementById('cnpj');
    const cepInput = document.getElementById('cep');
    const supplierForm = document.getElementById('supplierForm');
    const isencaoSelect = document.getElementById('isencaoFiscal');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const totalSteps = 4;

    let currentStep = 1;
    let cnpjValidated = false;
    let cnpjAttempts = {};
    let lastSubmittedData = {}; // To keep data for PDF after form reset

    // --- NAVIGATION LOGIC ---
    function showStep(step) {
        document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section${step}`).classList.add('active');

        const progress = ((step - 1) / (totalSteps - 1)) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;

        document.querySelectorAll('.step-indicator').forEach((ind, index) => {
            if (index + 1 === step) {
                ind.classList.add('active');
                ind.classList.remove('completed');
                ind.innerHTML = index + 1;
            } else if (index + 1 < step) {
                ind.classList.remove('active');
                ind.classList.add('completed');
                ind.innerHTML = '✓';
            } else {
                ind.classList.remove('active', 'completed');
                ind.innerHTML = index + 1;
            }
        });

        prevBtn.style.display = step === 1 ? 'none' : 'block';
        if (step === totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'block';
            submitBtn.style.display = 'none';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    function validateStep(step) {
        const currentSection = document.getElementById(`section${step}`);
        const inputs = currentSection.querySelectorAll('input[required], select[required]');
        let errors = [];

        inputs.forEach(input => {
            input.classList.remove('input-error');
            if (!input.value.trim()) {
                input.classList.add('input-error');
                errors.push("Campo obrigatório vazio.");
            } else if (input.type === 'email' && !isValidEmail(input.value)) {
                input.classList.add('input-error');
                errors.push("E-mail inválido.");
            } else if (input.type === 'tel' && !isValidPhone(input.value)) {
                input.classList.add('input-error');
                errors.push("Telefone inválido.");
            }
        });

        if (step === 1 && !cnpjValidated) {
            cnpjInput.classList.add('input-error');
            const cleanCnpj = cnpjInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (cleanCnpj.length === 14) {
                cnpjAttempts[cleanCnpj] = (cnpjAttempts[cleanCnpj] || 0) + 1;
                if (cnpjAttempts[cleanCnpj] >= 2) {
                    document.getElementById('cnpjModal').style.display = 'flex';
                    errors.push("Confirme o CNPJ para prosseguir.");
                } else {
                    errors.push("CNPJ não validado.");
                }
            } else if (cleanCnpj.length === 11) {
                cnpjValidated = true;
                cnpjInput.classList.remove('input-error');
            } else {
                errors.push("CNPJ/CPF deve ter 11 ou 14 caracteres.");
            }
        }

        if (errors.length > 0) {
            showToast(errors[0]);
            return false;
        }
        return true;
    }

    // --- PREVENT ENTER KEY FORM SUBMISSION ---
    supplierForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Impede o envio indesejado ou comportamentos estranhos
            if (document.activeElement.tagName === 'INPUT') {
                document.activeElement.blur(); // Força a saída do campo para disparar as validações (como a do CNPJ)
            }
        }
    });

    // --- CNPJ AUTOMATION ---
    cnpjInput.addEventListener('input', (e) => {
        cnpjValidated = false;
        cnpjInput.style.borderColor = '#CBD5E0';
        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        if (val.length <= 11) {
            let x = val.match(/([A-Z0-9]{0,3})([A-Z0-9]{0,3})([A-Z0-9]{0,3})([A-Z0-9]{0,2})/);
            if (x) e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + (x[3] ? '.' + x[3] : '') + (x[4] ? '-' + x[4] : '');
        } else {
            let x = val.match(/([A-Z0-9]{0,2})([A-Z0-9]{0,3})([A-Z0-9]{0,3})([A-Z0-9]{0,4})([A-Z0-9]{0,2})/);
            if (x) e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + '.' + x[3] + '/' + x[4] + (x[5] ? '-' + x[5] : '');
        }
    });

    let isFetchingCnpj = false;

    cnpjInput.addEventListener('blur', async () => {
        const cnpj = cnpjInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (cnpj.length !== 14 || isFetchingCnpj) return;

        isFetchingCnpj = true;
        showLoading('cnpjLoading', true);
        cnpjInput.placeholder = "Buscando dados...";

        try {
            let response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
            if (!response.ok) response = await fetch(`https://brasilapi.com.br/api/cnpj/v2/${cnpj}`);
            
            // Fallback para uma terceira API gratuita caso a BrasilAPI esteja fora do ar
            if (!response.ok) response = await fetch(`https://minhareceita.org/${cnpj}`);
            
            if (!response.ok) throw new Error();

            cnpjValidated = true;
            const data = await response.json();

            fillField('razaoSocial', data.razao_social || data.nome_empresarial || data.nome || data.razao_social);
            fillField('nomeFantasia', data.nome_fantasia || data.razao_social || data.nome || data.nome_fantasia);
            fillField('cep', data.cep);

            if (data.logradouro) {
                const addr = `${data.logradouro}${data.numero ? ', ' + data.numero : ''}`;
                fillField('logradouro', addr);
            }
            fillField('cidade', data.municipio);
            fillField('estado', data.uf);
            fillField('email', data.email);
            fillField('telefone', data.ddd_telefone_1 || data.telefone);

            if (data.opcao_pelo_simples !== undefined) {
                document.getElementById('regimeTributario').value = data.opcao_pelo_simples ? 'Simples Nacional' : 'Lucro Real';
            }
        } catch (error) {
            cnpjInput.style.borderColor = 'var(--accent-red)';
            const clean = cnpjInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            cnpjAttempts[clean] = (cnpjAttempts[clean] || 0) + 1;
            if (cnpjAttempts[clean] === 1) showToast("CNPJ não encontrado ou sistema fora do ar.");
            else document.getElementById('cnpjModal').style.display = 'flex';
        } finally {
            isFetchingCnpj = false;
            showLoading('cnpjLoading', false);
            cnpjInput.placeholder = "CNPJ ou CPF";
        }
    });

    window.confirmCNPJ = (isCorrect) => {
        document.getElementById('cnpjModal').style.display = 'none';
        if (isCorrect) {
            cnpjValidated = true;
            showToast("Preencha os dados manualmente.");
            cnpjInput.style.borderColor = '#CBD5E0';
        } else {
            cnpjInput.value = '';
            cnpjInput.focus();
        }
    };

    // --- OTHER AUTOMATIONS ---
    cepInput.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,5})(\d{0,3})/);
        e.target.value = !x[2] ? x[1] : x[1] + '-' + x[2];
    });

    cepInput.addEventListener('blur', async () => {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return;
        showLoading('cepLoading', true);
        try {
            const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const d = await r.json();
            if (!d.erro) {
                fillField('logradouro', d.logradouro);
                fillField('cidade', d.localidade);
                fillField('estado', d.uf);
            }
        } catch (e) { } finally { showLoading('cepLoading', false); }
    });

    // --- TOGGLES & SYNC ---
    document.getElementById('isentoIE').addEventListener('change', (e) => {
        const ie = document.getElementById('inscricaoEstadual');
        ie.value = e.target.checked ? 'ISENTO' : '';
        ie.readOnly = e.target.checked;
        ie.style.backgroundColor = e.target.checked ? '#f1f2f6' : 'var(--white)';
    });

    isencaoSelect.addEventListener('change', (e) => {
        document.getElementById('qualIsencaoGroup').style.display = e.target.value === 'Sim' ? 'flex' : 'none';
    });

    const setupSync = (checkboxId, inputId, sourceId) => {
        const cb = document.getElementById(checkboxId);
        const inp = document.getElementById(inputId);
        const src = document.getElementById(sourceId);
        cb.addEventListener('change', () => {
            if (cb.checked) {
                inp.value = src.value || 'NÃO POSSUO';
                inp.readOnly = true;
                inp.style.backgroundColor = '#f1f2f6';
            } else {
                inp.value = '';
                inp.readOnly = false;
                inp.style.backgroundColor = 'var(--white)';
            }
        });
        src.addEventListener('input', () => { if (cb.checked) inp.value = src.value; });
    };

    setupSync('naoPossuoEmailFin', 'emailFinanceiro', 'email');
    setupSync('naoPossuoTelFin', 'telefoneFinanceiro', 'telefone');
    setupSync('naoPossuoEmailLog', 'emailLogistico', 'email');
    setupSync('naoPossuoTelLog', 'telefoneLogistico', 'telefone');

    // --- MASKS ---
    const phoneMask = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 11) val = val.substring(0, 11);
        let x = val.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    };
    ['telefone', 'telefoneFinanceiro', 'telefoneLogistico'].forEach(id => {
        document.getElementById(id).addEventListener('input', phoneMask);
    });

    // --- FORM SUBMIT ---
    // Removido EmailJS para usar SMTP direto via PHP (mais seguro)

    supplierForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        const btnText = btn.querySelector('span');
        const btnLoading = document.getElementById('btnLoading');

        btnText.style.display = 'none';
        btnLoading.style.display = 'block';
        btn.disabled = true;

        // CAPTURE DATA FOR EMAIL AND PDF
        const formData = new FormData(supplierForm);
        lastSubmittedData = Object.fromEntries(formData.entries());

        // FUNÇÃO PARA GERAR O PDF EM BASE64 PARA O ANEXO
        const getPdfBase64 = () => {
            return new Promise((resolve) => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const data = lastSubmittedData;
                let y = 45;

                // Header Background
                doc.setFillColor(236, 22, 43);
                doc.rect(0, 0, 210, 25, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.text("FICHA DE CADASTRO - HIPERROLL", 20, 16);

                const finishPdfData = () => {
                    const addSect = (t) => {
                        if (y > 260) { doc.addPage(); y = 20; }
                        doc.setFontSize(14); doc.setTextColor(32, 35, 109); doc.setFont("helvetica", "bold"); doc.text(t, 20, y);
                        y += 2; doc.setDrawColor(236, 22, 43); doc.line(20, y, 190, y); y += 8;
                    };
                    const addF = (l, v) => {
                        if (y > 280) { doc.addPage(); y = 20; }
                        const labelLines = doc.splitTextToSize(`${l}:`, 60);
                        const valueLines = doc.splitTextToSize(String(v || "N/A"), 90);
                        const lineHeight = 7;
                        const lines = Math.max(labelLines.length, valueLines.length);
                        doc.setFontSize(10);
                        for (let i = 0; i < lines; i++) {
                            if (labelLines[i]) {
                                doc.setFont("helvetica", "bold");
                                doc.setTextColor(40, 40, 40);
                                doc.text(labelLines[i], 20, y + (i * lineHeight));
                            }
                            if (valueLines[i]) {
                                doc.setFont("helvetica", "normal");
                                doc.text(valueLines[i], 95, y + (i * lineHeight));
                            }
                        }
                        y += lines * lineHeight;
                    };

                    addSect("1. DADOS CADASTRAIS");
                    addF("Razão Social", data.razaoSocial);
                    addF("Nome Fantasia", data.nomeFantasia);
                    addF("CNPJ/CPF", data.cnpj);
                    addF("Ramo", data.ramo);
                    addF("Regime", data.regimeTributario);
                    y += 5;

                    addSect("2. LOCALIZAÇÃO E CONTATO");
                    addF("Endereço", data.logradouro);
                    addF("Cidade/UF", `${data.cidade || ''} - ${data.estado || ''}`);
                    addF("Telefone", data.telefone);
                    addF("E-mail", data.email);
                    addF("Representante", data.representante);
                    y += 5;

                    addSect("3. FINANCEIRO E FISCAL");
                    addF("IE", data.inscricaoEstadual);
                    addF("Isenção Fiscal?", data.isencaoFiscal);
                    if (data.isencaoFiscal === 'Sim') {
                        addF("Tipo de Isenção", data.qualIsencao);
                    }
                    addF("Forma Pagto", data.formaPagamento);
                    addF("Cliente paga boleto de Terceiros?", data.clientePagaBoletos);
                    addF("Boleto anexado a NF?", data.boletoAnexadoNF);
                    addF("Prazo Pagto", data.prazoPagamento);
                    addF("E-mail Fin.", data.emailFinanceiro);
                    addF("Tel. Fin.", data.telefoneFinanceiro);
                    addF("Status IBS/CBS", data.statusIbsCbs);
                    addF("Alteração Regime Tributário 2027?", data.alteracaoRegimeTributario);
                    y += 5;

                    addSect("4. LOGÍSTICA");
                    addF("Receb. NF", data.horarioNF);
                    addF("Receb. Mercadoria", data.horarioMercadoria);
                    addF("Agendamento?", data.agendamento);
                    addF("Tipo de Carga", data.tipoCarga);
                    addF("Pagto Descarga?", data.pagamentoDescarga);
                    addF("Necessita Chapa?", data.necessidadeChapa);
                    addF("Restrições Veíc.?", data.restricoesVeiculo);
                    addF("Carga Terceiros?", data.acessoTerceiros);
                    addF("E-mail Log.", data.emailLogistico);
                    addF("Tel. Log.", data.telefoneLogistico);

                    if (data.observacoes) {
                        y += 5;
                        addSect("OBSERVAÇÕES");
                        const splitObs = doc.splitTextToSize(data.observacoes, 170);
                        doc.text(splitObs, 20, y);
                    }

                    // Retorna apenas a string base64 (removendo o prefixo data:application/pdf;base64,)
                    const fullBase64 = doc.output('datauristring');
                    resolve(fullBase64.split(',')[1]);
                };

                const logoUrlProxy = "https://images.weserv.nl/?url=hiperroll.com.br/storage/2024/11/Novo-Logotipo-2-contorno-branco-HiperRoll.png";
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = function () {
                    try { doc.addImage(this, 'PNG', 155, 5, 35, 15); } catch (e) {}
                    finishPdfData();
                };
                img.onerror = finishPdfData;
                img.src = logoUrlProxy;
            });
        };

        // GERA O PDF E DEPOIS ENVIA O E-MAIL
        getPdfBase64().then(pdfBase64 => {
            const payload = {
                ...lastSubmittedData,
                pdfAttachment: pdfBase64,
                pdfName: `Ficha_Hiperroll_${lastSubmittedData.razaoSocial.replace(/[^a-z0-9]/gi, '_')}.pdf`
            };

            fetch('send_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) throw new Error('Erro na rede');
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log('E-mail enviado com sucesso com anexo!');
                    showFinalSuccess();
                } else {
                    throw new Error(data.message || 'Erro no servidor');
                }
            })
            .catch((error) => {
                console.error('Falha no envio do e-mail:', error);
                showToast("Aviso: Cadastro realizado, mas houve um erro no envio do e-mail com anexo.");
                showFinalSuccess();
            });
        });

        function showFinalSuccess() {
            setTimeout(() => {
                document.getElementById('successModal').style.display = 'flex';
                supplierForm.reset();
                cnpjValidated = false;
                currentStep = 1;
                showStep(1);
                btnText.style.display = 'block';
                btnLoading.style.display = 'none';
                btn.disabled = false;
            }, 1000);
        }
    });

    // Helper to generate PDF as Base64 for the email
    async function generatePDFBase64() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = lastSubmittedData;
        let y = 45;

        // Draw the PDF structure (Same as the main generatePDF)
        doc.setFillColor(236, 22, 43);
        doc.rect(0, 0, 210, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text("FICHA DE CADASTRO - HIPERROLL", 20, 16);

        const addSect = (t) => {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFontSize(14); doc.setTextColor(32, 35, 109); doc.setFont("helvetica", "bold"); doc.text(t, 20, y);
            y += 2; doc.setDrawColor(236, 22, 43); doc.line(20, y, 190, y); y += 8;
        };
        const addF = (l, v) => {
            if (y > 280) { doc.addPage(); y = 20; }
            const labelLines = doc.splitTextToSize(`${l}:`, 70);
            const valueLines = doc.splitTextToSize(String(v || "N/A"), 90);
            const lineHeight = 7;
            const lines = Math.max(labelLines.length, valueLines.length);
            doc.setFontSize(10);
            for (let i = 0; i < lines; i++) {
                if (labelLines[i]) {
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(40, 40, 40);
                    doc.text(labelLines[i], 20, y + (i * lineHeight));
                }
                if (valueLines[i]) {
                    doc.setFont("helvetica", "normal");
                    doc.text(valueLines[i], 95, y + (i * lineHeight));
                }
            }
            y += lines * lineHeight;
        };

        addSect("1. DADOS CADASTRAIS");
        addF("Razão Social", data.razaoSocial);
        addF("CNPJ", data.cnpj);
        y += 5;
        addSect("2. LOCALIZAÇÃO");
        addF("Endereço", data.logradouro);
        addF("Cidade/UF", `${data.cidade || ''} - ${data.estado || ''}`);
        y += 5;
        addSect("3. FINANCEIRO");
        addF("IE", data.inscricaoEstadual);
        addF("Prazo", data.prazoPagamento);
        y += 5;
        addSect("4. LOGÍSTICA");
        addF("Tipo Carga", data.tipoCarga);
        addF("Obs", data.observacoes);

        // Return as data URL (Base64)
        return doc.output('datauristring');
    }

    // --- PDF ---
    window.generatePDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = lastSubmittedData; // Use captured data
        let y = 45;

        // Header Background
        doc.setFillColor(236, 22, 43);
        doc.rect(0, 0, 210, 25, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("FICHA DE CADASTRO - HIPERROLL", 20, 16);

        // Logo
        const logoUrl = "https://hiperroll.com.br/storage/2024/11/Novo-Logotipo-2-contorno-branco-HiperRoll.png";

        const finishPdf = () => {
            const addSect = (t) => {
                if (y > 260) { doc.addPage(); y = 20; }
                doc.setFontSize(14); doc.setTextColor(32, 35, 109); doc.setFont("helvetica", "bold"); doc.text(t, 20, y);
                y += 2; doc.setDrawColor(236, 22, 43); doc.line(20, y, 190, y); y += 8;
            };
            const addF = (l, v) => {
                if (y > 280) { doc.addPage(); y = 20; }
                const labelLines = doc.splitTextToSize(`${l}:`, 70);
                const valueLines = doc.splitTextToSize(String(v || "N/A"), 90);
                const lineHeight = 7;
                const lines = Math.max(labelLines.length, valueLines.length);
                doc.setFontSize(10);
                for (let i = 0; i < lines; i++) {
                    if (labelLines[i]) {
                        doc.setFont("helvetica", "bold");
                        doc.setTextColor(40, 40, 40);
                        doc.text(labelLines[i], 20, y + (i * lineHeight));
                    }
                    if (valueLines[i]) {
                        doc.setFont("helvetica", "normal");
                        doc.text(valueLines[i], 95, y + (i * lineHeight));
                    }
                }
                y += lines * lineHeight;
            };

            addSect("1. DADOS CADASTRAIS");
            addF("Razão Social", data.razaoSocial);
            addF("Nome Fantasia", data.nomeFantasia);
            addF("CNPJ/CPF", data.cnpj);
            addF("Ramo", data.ramo);
            addF("Regime", data.regimeTributario);
            y += 5;

            addSect("2. LOCALIZAÇÃO E CONTATO");
            addF("Endereço", data.logradouro);
            addF("Cidade/UF", `${data.cidade || ''} - ${data.estado || ''}`);
            addF("Telefone", data.telefone);
            addF("E-mail", data.email);
            addF("Representante", data.representante);
            y += 5;

            addSect("3. FINANCEIRO E FISCAL");
            addF("IE", data.inscricaoEstadual);
            addF("Isenção Fiscal?", data.isencaoFiscal);
            if (data.isencaoFiscal === 'Sim') {
                addF("Tipo de Isenção", data.qualIsencao);
            }
            addF("Forma Pagto", data.formaPagamento);
            addF("Cliente paga boleto de Terceiros?", data.clientePagaBoletos);
            addF("Boleto anexado a NF?", data.boletoAnexadoNF);
            addF("Prazo Pagto", data.prazoPagamento);
            addF("E-mail Fin.", data.emailFinanceiro);
            addF("Tel. Fin.", data.telefoneFinanceiro);
            addF("Status IBS/CBS", data.statusIbsCbs);
            addF("Alteração Regime Tributário 2027?", data.alteracaoRegimeTributario);
            y += 5;

            addSect("4. LOGÍSTICA");
            addF("Receb. NF", data.horarioNF);
            addF("Receb. Mercadoria", data.horarioMercadoria);
            addF("Agendamento?", data.agendamento);
            addF("Tipo de Carga", data.tipoCarga);
            addF("Pagto Descarga?", data.pagamentoDescarga);
            addF("Necessita Chapa?", data.necessidadeChapa);
            addF("Restrições Veíc.?", data.restricoesVeiculo);
            addF("Carga Terceiros?", data.acessoTerceiros);
            addF("E-mail Log.", data.emailLogistico);
            addF("Tel. Log.", data.telefoneLogistico);
            y += 5;

            // SPECIAL OBSERVATIONS SECTION
            if (data.observacoes && data.observacoes.trim() !== "") {
                addSect("OBSERVAÇÕES IMPORTANTES");
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(60, 60, 60);
                const splitObs = doc.splitTextToSize(data.observacoes, 170);
                doc.text(splitObs, 20, y);
                y += (splitObs.length * 6) + 5;
            }

            doc.save(`Ficha_Hiperroll_${data.razaoSocial || 'Cadastro'}.pdf`);
        };

        // Load image first (using a proxy to bypass CORS issues)
        const logoUrlProxy = "https://images.weserv.nl/?url=hiperroll.com.br/storage/2024/11/Novo-Logotipo-2-contorno-branco-HiperRoll.png";
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function () {
            try {
                doc.addImage(this, 'PNG', 155, 5, 35, 15);
            } catch (e) { console.error("Error drawing logo:", e); }
            finishPdf();
        };
        img.onerror = function () {
            console.warn("Logo failed to load via proxy, generating without it.");
            finishPdf();
        };
        img.src = logoUrlProxy;
    };

    function showToast(m) {
        const c = document.getElementById('toastContainer');
        const t = document.createElement('div');
        t.className = 'toast';
        t.innerHTML = `<div class="toast-icon">!</div><div class="toast-message">${m}</div>`;
        c.appendChild(t);
        setTimeout(() => { t.classList.add('fade-out'); setTimeout(() => t.remove(), 300); }, 4000);
    }
    function fillField(id, v) {
        const f = document.getElementById(id);
        if (f && v) { f.value = v; f.classList.add('auto-filled'); setTimeout(() => f.classList.remove('auto-filled'), 1500); }
    }
    function showLoading(id, s) { const el = document.getElementById(id); if (el) el.style.display = s ? 'block' : 'none'; }
    function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
    function isValidPhone(p) { return p.replace(/\D/g, '').length >= 10; }
});

function closeModal() { document.getElementById('successModal').style.display = 'none'; }
