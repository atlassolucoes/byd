# ⚡ BYD Dolphin — Monitor de Energia

Sistema para Victoria acompanhar os gastos de energia do BYD Dolphin Mini,
integrando com Google Sheets via Apps Script.

---

## Estrutura do projeto

```
byd-monitor/
├── index.html   ← front-end (hospedar no GitHub Pages)
└── Code.gs      ← script do Google Sheets (colar no Apps Script)
```

---

## Passo a passo de configuração

### 1. Configurar o Google Apps Script

1. Abra a planilha:
   👉 https://docs.google.com/spreadsheets/d/1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw/edit

2. Clique em **Extensões → Apps Script**

3. Apague o código que aparecer e cole todo o conteúdo do arquivo `Code.gs`

4. Salve (Ctrl+S)

5. No editor, selecione a função `setupPlanilha` no menu suspenso e clique em ▶ **Executar**
   - Isso vai criar todas as abas com os cabeçalhos corretos
   - Pode pedir permissão — aceite

6. Agora clique em **Implantar → Nova implantação**
   - Tipo: **App da Web**
   - Descrição: `BYD Monitor v1`
   - Executar como: **Eu (seu e-mail)**
   - Quem tem acesso: **Qualquer pessoa**
   - Clique em **Implantar**

7. **Copie a URL gerada** — ela tem o formato:
   `https://script.google.com/macros/s/XXXX.../exec`

---

### 2. Hospedar no GitHub Pages

1. Crie um repositório no GitHub chamado `byd-monitor`

2. Faça upload do arquivo `index.html`

3. Vá em **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / pasta `/ (root)`
   - Salve

4. Em alguns minutos o site estará disponível em:
   `https://SEU_USUARIO.github.io/byd-monitor`

---

### 3. Conectar o front-end ao Sheets

1. Abra o site no celular ou PC

2. Toque na aba **Config**

3. Cole a URL do Apps Script no campo indicado

4. Ajuste a tarifa de energia (R$/kWh) conforme sua conta da Enel/Coelce

5. Clique em **Salvar configurações**

6. O indicador no topo deve mudar para **● online**

---

## Como usar no dia a dia

| Situação | Ação |
|---|---|
| Vai carregar em casa | Registre "Antes do carro" no medidor |
| Terminou de carregar | Registre "Depois do carro" + carga em casa |
| Carregou em posto externo | Registre em "Posto externo" com valor pago |
| Chegou a conta de luz | Registre na aba "Fatura de luz" |
| Leitura de rotina | Registre no medidor ao acordar e dormir |

---

## Abas da planilha

| Aba | O que guarda |
|---|---|
| **Carregamentos** | Cargas feitas em casa |
| **Postos** | Cargas pagas em postos externos |
| **Medidor** | Leituras do medidor de energia |
| **Faturas** | Dados da conta de luz mensal |
| **Resumo** | Totais calculados automaticamente |

---

## Planilha

ID: `1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw`
Link: https://docs.google.com/spreadsheets/d/1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw/edit
