/**
 * Script de Teste - Reservas Online Desbravador
 * 
 * Ferramenta: Playwright (Node.js)
 *
 * Pré-requisitos:
 *   npm init -y
 *   npm install playwright
 *   npx playwright install chromium
 *
 * Execução:
 *   node teste_reserva_desbravador.js
 */

const { chromium } = require('playwright');

// Configurações
const CONFIG = {
  url: 'https://reservas.desbravador.com.br/1111',
  timeout: 30000,
  slowMo: 600,
  checkin:  obterDataFutura(3),
  checkout: obterDataFutura(6),
  adultos:      2,
  criancaFaixa1: 1, 
  hospedes: [
    { nome: 'João Silva',     email: 'joao.silva@teste.com' },
    { nome: 'Maria Oliveira', email: 'maria.oliveira@teste.com' },
    { nome: 'Pedro Silva',    email: '' },
  ],
  pagante: {
    email:         'joao.silva@teste.com',
    firstName:     'João',
    lastName:      'Silva',
    documentType:  'CPF',          
    document:      '123.456.789-09',
    telephone:     '(49) 99999-0001',
    pais:          'Brasil',
    zipCode:       '89802-121',
    neighborhood:  'Jardim Itália',
    address:       'Rua Mal. José B. Bormann, 1001'
    },
  cartao: {
    numero: '4000 0000 0000 0044',
    nome:   'DESBRAVADOR SOFTWARE',
    validade: '12/26',
    cvc: '123'
  }
};

// Utilitários
function obterDataFutura(diasAFrente) {
  const d = new Date();
  d.setDate(d.getDate() + diasAFrente);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return { dia, mes, ano, iso: `${ano}-${mes}-${dia}`, exibicao: `${dia}/${mes}/${ano}` };
}

function log(etapa, msg) { console.log(`[${new Date().toLocaleTimeString('pt-BR')}] [${etapa}] ${msg}`); }
function logSucesso(etapa, msg) { console.log(`[✅ ${etapa}] ${msg}`); }
function logErro(etapa, msg) { console.error(`[❌ ${etapa}] ${msg}`); }

// Função principal 
async function executarTeste() {
  let browser;
  let resultado = { sucesso: false, erro: null };

  try {
    browser = await chromium.launch({ headless: false, slowMo: CONFIG.slowMo });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'pt-BR' });
    const page = await context.newPage();
    page.setDefaultTimeout(CONFIG.timeout);

    // 1. Acessar
    log('ETAPA 1', `Acessando ${CONFIG.url}`);
    await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="calendar-adults"]');
    logSucesso('ETAPA 1', 'Página inicial carregada');

    // 2. Datas
    log('ETAPA 2', 'Selecionando datas...');
    const campoData = page.locator('input[name="checkin"], .date-range-input, [class*="date-picker"]').first();
    await campoData.click().catch(() => {});
    await selecionarDataNoCalendario(page, CONFIG.checkin);
    await selecionarDataNoCalendario(page, CONFIG.checkout);
    logSucesso('ETAPA 2', 'Período selecionado');

    // 3. Hóspedes
    log('ETAPA 3', 'Configurando adultos e crianças');
    await page.locator('input[name="calendar-adults"]').fill(String(CONFIG.adultos));
    await page.locator('.btn-children-container .dropdown-toggle').click();
    await page.locator('input#faixa1').fill(String(CONFIG.criancaFaixa1));
    await page.keyboard.press('Escape');
    logSucesso('ETAPA 3', 'Hóspedes configurados');

    // 4. Disponibilidade
    log('ETAPA 4', 'Verificando disponibilidade...');
    await page.locator('button:has-text("Verificar Disponibilidade")').click();
    await page.waitForLoadState('networkidle');
    logSucesso('ETAPA 4', 'Acomodações carregadas');

    // 5. Adicionar Quarto
    log('ETAPA 5', 'Adicionando quarto ao carrinho...');

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const botoes = page.locator('button.btn-add');
    await botoes.first().waitFor({ state: 'visible' });
    await botoes.first().click({ force: true });
    await page.waitForSelector('text="Resumo"', { timeout: 10000 });
    logSucesso('ETAPA 5', 'Quarto adicionado');

    // 2. Espera o botão "Continuar" aparecer na lateral 
    const btnContinuar = page.locator('button:has-text("Continuar")').last();
    
    // Espera até que ele esteja visível e habilitado para clique
    await btnContinuar.waitFor({ state: 'visible', timeout: 15000 });
    await btnContinuar.scrollIntoViewIfNeeded();
    await btnContinuar.click({ force: true });
    
    logSucesso('ETAPA 5', 'Quarto adicionado e Continuar clicado com sucesso!');

    // 6. Informar Hóspedes
    log('ETAPA 6', 'Abrindo e preenchendo formulário de hóspedes...');

    const btnAbrirHospedes = page.locator('button:has-text("Hóspede"), button:has-text("Informar")').first();
    if (await btnAbrirHospedes.isVisible({ timeout: 5000 })) {
        await btnAbrirHospedes.click({ force: true });
    }

    const modal = page.locator('.modal.show, [role="dialog"]').first();
    await modal.waitFor({ state: 'visible', timeout: 15000 });

    // 3. Preenche os campos de Nome dentro do modal
    const camposNome = modal.locator('input[type="text"]');
    for (let i = 0; i < CONFIG.hospedes.length; i++) {
        if (await camposNome.nth(i).isVisible()) {
            await camposNome.nth(i).fill(CONFIG.hospedes[i].nome);
        }
    }

    // 4. Salva o modal
    const btnSalvar = modal.locator('button').filter({ hasText: /Salvar|Confirmar/i }).first();
    await btnSalvar.click({ force: true });

    // 5. ESSENCIAL: Aguarda o modal sumir completamente antes de prosseguir
    await modal.waitFor({ state: 'hidden', timeout: 10000 });
    logSucesso('ETAPA 6', 'Hóspedes preenchidos e modal salvo');

    // 6. Clica no botão "Continuar" final da página (fora do modal)
    log('ETAPA 6.5', 'Clicando em Continuar após salvar hóspedes...');
    const btnContinuarFinal = page.locator('button:has-text("Continuar")').first();
    await btnContinuarFinal.waitFor({ state: 'visible', timeout: 10000 });
    await btnContinuarFinal.click({ force: true });

    await page.waitForURL('**/checkout**', { timeout: 15000 });
    logSucesso('ETAPA 6.5', 'Checkout carregado');

    //Preenchendo dados pagante e cartão
    log('ETAPA 7', 'Preenchendo pagante...');
    const p = CONFIG.pagante;
    await page.locator('input[name="email"]').fill(p.email);
    await page.locator('input[name="firstName"]').fill(p.firstName);
    await page.locator('input[name="lastName"]').fill(p.lastName);
    await page.locator('input[name="document"]').fill(p.document);
    logSucesso('ETAPA 7', 'Dados do pagante OK');

    // 7. Dados do Pagante e Cartão
    log('ETAPA 7', 'Preenchendo pagante e cartão...');
    await page.locator('input[name="email"]').fill(CONFIG.pagante.email);
    
    await page.locator('input[name="firstName"]').fill(CONFIG.pagante.firstName);
    await page.locator('input[name="lastName"]').fill(CONFIG.pagante.lastName);
    await page.locator('input[name="document"]').fill(CONFIG.pagante.document);

    // PREENCHIMENTO DE CARTÃO 
    log('ETAPA 7.5', 'Preenchendo dados do cartão...');
    
    const cardFrame = page.frames().find(f => f.url().includes('payment') || f.name().includes('card'));
    const target = cardFrame || page; 

    await target.locator('input[name*="number"], input[id*="number"]').fill(CONFIG.cartao.numero);
    await target.locator('input[name*="name"], input[id*="name"]').fill(CONFIG.cartao.nome);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    await target.locator('input[name*="expiry"], input[id*="expiry"]').fill(CONFIG.cartao.validade);
    await target.locator('input[name*="cvc"], input[id*="cvc"]').fill(CONFIG.cartao.cvc);
    
    logSucesso('ETAPA 7.5', 'Dados do pagante e cartão preenchidos');

    // 8. Finalizar
    await page.locator('button.btn-finish, button:has-text("Finalizar")').click();
    logSucesso('ETAPA 8', 'Reserva finalizada!');
    resultado.sucesso = true;

  } catch (erro) {
    resultado.erro = erro.message;
    logErro('TESTE', `Falha: ${erro.message}`);
  } finally {
    await browser?.close();
    process.exit(resultado.sucesso ? 0 : 1);
  }
}

async function selecionarDataNoCalendario(page, data) {
    const mesesPT = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const mesAlvo = parseInt(data.mes) - 1;
    const anoAlvo = parseInt(data.ano);
    
    for (let tentativa = 0; tentativa < 12; tentativa++) {
        const mesAnoTexto = await page.locator('.month-name').first().innerText().catch(() => '');
        const mesAtual = mesesPT.findIndex(m => mesAnoTexto.toLowerCase().includes(m));
        const anoAtual = parseInt(mesAnoTexto.match(/\d{4}/)?.[0] ?? '0');
        if (mesAtual === mesAlvo && anoAtual === anoAlvo) {
            await page.locator(`.day.toMonth.valid:has-text("${parseInt(data.dia)}")`).first().click();
            return;
        }
        await page.locator(anoAtual < anoAlvo || (anoAtual === anoAlvo && mesAtual < mesAlvo) ? '.next' : '.prev').first().click();
        await page.waitForTimeout(300);
    }
}

executarTeste();