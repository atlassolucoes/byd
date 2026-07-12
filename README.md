# ⚡ BYD Dolphin — Monitor de Energia

Dashboard de consumo de energia do BYD Dolphin Mini + conta de luz, publicado
em GitHub Pages e atualizado automaticamente a partir do Google Sheets — mesmo
padrão do Dashboard Financeiro, Pinho Law e MGO.

---

## Arquitetura

```
Google Sheets
     │
     ▼ (gspread via Service Account, somente leitura)
fetch_data.py
     │ injeta const DATA= no HTML
     ▼
dashboard.html  ──▶  GitHub Pages (https://atlassolucoes.github.io/byd/dashboard.html)
     ▲
GitHub Actions (08h/20h + push + manual)
```

Diferente do desenho original deste projeto (Apps Script Web App recebendo
gravações em tempo real do celular), aqui os dados são **digitados direto na
planilha** e o dashboard só lê e exibe — assim evitamos o bloqueio de
implantação de Apps Script que travou o Dashboard Financeiro. O arquivo
`formulario-mobile.html` (Apps Script `Code.gs` + formulário mobile) continua
no repositório como opção futura, caso valha a pena revisitar a gravação em
tempo real via outro backend (ex. Cloudflare Worker).

---

## Configuração inicial (passos manuais, feitos uma única vez)

### 1. Compartilhar a planilha com a service account

A planilha precisa ser compartilhada como **Leitor** com:
`agp-dashboard@agp-dashboard.iam.gserviceaccount.com`
(mesma service account já usada no Pinho Law e MGO)

### 2. Criar a estrutura de abas

1. Abra a planilha → **Extensões → Apps Script**
2. Cole o conteúdo de `Code.gs`
3. No menu suspenso, selecione a função `setupPlanilha` e clique em ▶ **Executar**
   (isso só cria as abas com cabeçalho — **não precisa implantar como Web App**)

### 3. Preencher os dados

Registre direto nas abas da planilha (ou usando o app `formulario-mobile.html`
localmente, se quiser testar a gravação via Apps Script por conta própria).

---

## Abas da planilha

| Aba | Colunas |
|---|---|
| **Carregamentos** | Data/Hora, Tipo, % Inicial, % Final, kWh Estimado, Custo (R$), Km Atual, Local / Observação |
| **Postos** | Data/Hora, Nome do Posto, Cidade, kWh Carregados, Valor Total (R$), R$/kWh, Km Atual, Observação |
| **Medidor** | Data/Hora, Tipo de Leitura, Leitura (kWh), Diferença (kWh), Km Carro, Observação |
| **Faturas** | Mês Ref., Vencimento, kWh Total, Valor Total (R$), kWh Estimado Carro, Custo Carro (R$), % Carro na Fatura, Tarifa R$/kWh, Bandeira, Observação |

O dashboard calcula os totais (gasto médio por kWh, gasto mensal, % da fatura
referente ao carro etc.) no próprio HTML — a aba `Resumo` da planilha não é
usada pelo dashboard.

---

## Atualização automática

Workflow roda **08h e 20h (Brasília)**, a cada push na `main`, e manualmente
via **Actions → Update BYD Dashboard → Run workflow** (ou digitando
"ATUALIZE O BYD" para a Claude disparar via API).

## Planilha

ID: `1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw`
Link: https://docs.google.com/spreadsheets/d/1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw/edit
