// ============================================================
// BYD Dolphin — Controle de Energia
// Google Apps Script — Cole este código no Apps Script da planilha
// ID da planilha: 1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw
// ============================================================

const SHEET_ID = '1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw';

// Cabeçalhos de cada aba
const HEADERS = {
  Carregamentos: [
    'Data/Hora', 'Tipo', '% Inicial', '% Final', 'kWh Estimado',
    'Custo (R$)', 'Km Atual', 'Local / Observação'
  ],
  Postos: [
    'Data/Hora', 'Nome do Posto', 'Cidade', 'kWh Carregados',
    'Valor Total (R$)', 'R$/kWh', 'Km Atual', 'Observação'
  ],
  Medidor: [
    'Data/Hora', 'Tipo de Leitura', 'Leitura (kWh)', 'Diferença (kWh)',
    'Km Carro', 'Observação'
  ],
  Faturas: [
    'Mês Ref.', 'Vencimento', 'kWh Total', 'Valor Total (R$)',
    'kWh Estimado Carro', 'Custo Carro (R$)', '% Carro na Fatura',
    'Tarifa R$/kWh', 'Bandeira', 'Observação'
  ],
  Resumo: [
    'Métrica', 'Valor'
  ]
};

// ── Setup inicial: cria as abas com cabeçalhos ──────────────
function setupPlanilha() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  Object.entries(HEADERS).forEach(([nomAba, cabecalhos]) => {
    let aba = ss.getSheetByName(nomAba);
    if (!aba) {
      aba = ss.insertSheet(nomAba);
    }
    // Só escreve cabeçalho se a aba estiver vazia
    if (aba.getLastRow() === 0) {
      const range = aba.getRange(1, 1, 1, cabecalhos.length);
      range.setValues([cabecalhos]);
      range.setFontWeight('bold');
      range.setBackground('#1D9E75');
      range.setFontColor('#ffffff');
      aba.setFrozenRows(1);
      aba.autoResizeColumns(1, cabecalhos.length);
    }
  });

  // Aba Resumo com métricas fixas
  const abaResumo = ss.getSheetByName('Resumo');
  if (abaResumo.getLastRow() <= 1) {
    const metricas = [
      ['Total gasto com carro (R$)', '=SUMIF(Carregamentos!B:B,"Casa",Carregamentos!F:F)+SUMIF(Postos!D:D,"<>",Postos!E:E)'],
      ['Total gasto em casa - carregamentos (R$)', '=SUMIF(Carregamentos!B:B,"Casa",Carregamentos!F:F)'],
      ['Total gasto em postos externos (R$)', '=SUM(Postos!E:E)'],
      ['Total kWh carregado em casa', '=SUMIF(Carregamentos!B:B,"Casa",Carregamentos!E:E)'],
      ['Total kWh carregado em postos', '=SUM(Postos!D:D)'],
      ['Número de carregamentos em casa', '=COUNTIF(Carregamentos!B:B,"Casa")'],
      ['Número de carregamentos em postos', '=COUNTA(Postos!A:A)-1'],
      ['Última leitura do medidor (kWh)', '=IFERROR(INDEX(Medidor!C:C,MATCH(2,1/(Medidor!C:C<>""),1)),"—")'],
      ['Última fatura — valor total (R$)', '=IFERROR(INDEX(Faturas!D:D,MATCH(2,1/(Faturas!D:D<>""),1)),"—")'],
      ['Última fatura — custo carro (R$)', '=IFERROR(INDEX(Faturas!F:F,MATCH(2,1/(Faturas!F:F<>""),1)),"—")'],
    ];
    abaResumo.getRange(2, 1, metricas.length, 2).setValues(metricas);
    abaResumo.autoResizeColumns(1, 2);
  }

  // Remove aba padrão "Planilha1" se existir
  const padrao = ss.getSheetByName('Planilha1') || ss.getSheetByName('Sheet1');
  if (padrao) ss.deleteSheet(padrao);

  return 'Setup concluído com sucesso!';
}

// ── Ponto de entrada HTTP ────────────────────────────────────
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const { aba, dados } = payload;

    if (!aba || !dados) throw new Error('Payload inválido: faltam aba ou dados');

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(aba);
    if (!sheet) throw new Error(`Aba "${aba}" não encontrada`);

    // Para Medidor: calcula diferença automática
    if (aba === 'Medidor' && dados.length >= 3) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const ultimaLeitura = sheet.getRange(lastRow, 3).getValue();
        const leituraAtual = parseFloat(dados[2]);
        if (!isNaN(ultimaLeitura) && !isNaN(leituraAtual)) {
          dados[3] = (leituraAtual - ultimaLeitura).toFixed(2);
        }
      }
    }

    // Para Postos: calcula R$/kWh automaticamente
    if (aba === 'Postos' && dados[3] && dados[4]) {
      const kwh = parseFloat(dados[3]);
      const valor = parseFloat(dados[4]);
      if (kwh > 0) dados[5] = (valor / kwh).toFixed(3);
    }

    // Para Faturas: calcula % e custo carro
    if (aba === 'Faturas' && dados[2] && dados[3] && dados[4]) {
      const kwhTotal = parseFloat(dados[2]);
      const valorTotal = parseFloat(dados[3]);
      const kwhCarro = parseFloat(dados[4]);
      if (kwhTotal > 0) {
        const tarifa = valorTotal / kwhTotal;
        dados[5] = (kwhCarro * tarifa).toFixed(2);
        dados[6] = ((kwhCarro / kwhTotal) * 100).toFixed(1) + '%';
        dados[7] = tarifa.toFixed(4);
      }
    }

    sheet.appendRow(dados);

    return resposta({ ok: true, mensagem: 'Registro salvo com sucesso' });
  } catch (err) {
    return resposta({ ok: false, erro: err.message }, 400);
  }
}

function doGet(e) {
  try {
    const aba = e.parameter.aba;
    const ss = SpreadsheetApp.openById(SHEET_ID);

    if (aba === 'resumo') {
      const sheet = ss.getSheetByName('Resumo');
      const data = sheet.getDataRange().getValues();
      return resposta({ ok: true, dados: data });
    }

    if (aba) {
      const sheet = ss.getSheetByName(aba);
      if (!sheet) throw new Error(`Aba "${aba}" não encontrada`);
      const data = sheet.getDataRange().getValues();
      return resposta({ ok: true, dados: data });
    }

    return resposta({ ok: true, status: 'BYD Monitor API online' });
  } catch (err) {
    return resposta({ ok: false, erro: err.message }, 400);
  }
}

function resposta(obj, codigo) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
