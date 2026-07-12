#!/usr/bin/env python3
"""
Fetches data from Google Sheets and injects it as const DATA= into dashboard.html
"""

import os
import json
import re
from datetime import datetime

try:
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError:
    os.system("pip install gspread google-auth --quiet")
    import gspread
    from google.oauth2.service_account import Credentials

SHEET_ID = os.environ.get(
    "SHEET_ID",
    "1dyVsmvYX1rPnfNKMRh9qtEVlh84zrewA9fKB2TO4ivw"
)

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
]


def parse_date(val):
    if not val or str(val).strip() == "":
        return None
    val = str(val).strip()
    for fmt in (
        "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M",
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M",
        "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y",
        "%Y-%m",
    ):
        try:
            return datetime.strptime(val, fmt).strftime(
                "%Y-%m-%dT%H:%M:%S" if "%H" in fmt else "%Y-%m-%d"
            )
        except ValueError:
            pass
    return None


def parse_num(val):
    if val is None or str(val).strip() == "":
        return None
    val = str(val).strip()
    val = re.sub(r"[R$\s]", "", val)
    if "," in val and "." in val:
        val = val.replace(".", "").replace(",", ".")
    elif "," in val:
        val = val.replace(",", ".")
    try:
        return float(val)
    except ValueError:
        return None


def rows_to_dicts(worksheet):
    rows = worksheet.get_all_values()
    if not rows:
        return []
    headers = [h.strip() for h in rows[0]]
    result = []
    for row in rows[1:]:
        if not any(c.strip() for c in row):
            continue
        padded = row + [""] * (len(headers) - len(row))
        result.append(dict(zip(headers, padded)))
    return result


def get_worksheet(sh, name):
    try:
        return sh.worksheet(name)
    except gspread.exceptions.WorksheetNotFound:
        return None


def main():
    creds_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")
    if creds_json:
        import tempfile
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write(creds_json)
            creds_file = f.name
    else:
        creds_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "credentials.json")

    creds = Credentials.from_service_account_file(creds_file, scopes=SCOPES)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(SHEET_ID)

    # ── Carregamentos (cargas em casa) ─────────────────────────────────────
    carregamentos = []
    ws = get_worksheet(sh, "Carregamentos")
    if ws:
        for r in rows_to_dicts(ws):
            data = parse_date(r.get("Data/Hora", ""))
            if not data:
                continue
            carregamentos.append({
                "data": data,
                "tipo": str(r.get("Tipo", "")).strip(),
                "pct_ini": parse_num(r.get("% Inicial", "")),
                "pct_fim": parse_num(r.get("% Final", "")),
                "kwh": parse_num(r.get("kWh Estimado", "")),
                "custo": parse_num(r.get("Custo (R$)", "")),
                "km": parse_num(r.get("Km Atual", "")),
                "obs": str(r.get("Local / Observação", "")).strip(),
            })

    # ── Postos (cargas em postos externos) ─────────────────────────────────
    postos = []
    ws = get_worksheet(sh, "Postos")
    if ws:
        for r in rows_to_dicts(ws):
            data = parse_date(r.get("Data/Hora", ""))
            if not data:
                continue
            postos.append({
                "data": data,
                "nome": str(r.get("Nome do Posto", "")).strip(),
                "cidade": str(r.get("Cidade", "")).strip(),
                "kwh": parse_num(r.get("kWh Carregados", "")),
                "valor": parse_num(r.get("Valor Total (R$)", "")),
                "km": parse_num(r.get("Km Atual", "")),
                "obs": str(r.get("Observação", "")).strip(),
            })

    # ── Medidor (leituras) ──────────────────────────────────────────────────
    medidor = []
    ws = get_worksheet(sh, "Medidor")
    if ws:
        for r in rows_to_dicts(ws):
            data = parse_date(r.get("Data/Hora", ""))
            if not data:
                continue
            medidor.append({
                "data": data,
                "tipo": str(r.get("Tipo de Leitura", "")).strip(),
                "leitura": parse_num(r.get("Leitura (kWh)", "")),
                "km": parse_num(r.get("Km Carro", "")),
                "obs": str(r.get("Observação", "")).strip(),
            })

    # ── Faturas (conta de luz) ──────────────────────────────────────────────
    faturas = []
    ws = get_worksheet(sh, "Faturas")
    if ws:
        for r in rows_to_dicts(ws):
            mes = str(r.get("Mês Ref.", "")).strip()
            if not mes:
                continue
            kwh_total = parse_num(r.get("kWh Total", ""))
            valor_total = parse_num(r.get("Valor Total (R$)", ""))
            kwh_carro = parse_num(r.get("kWh Estimado Carro", ""))
            tarifa = (valor_total / kwh_total) if kwh_total else None
            custo_carro = (kwh_carro * tarifa) if (kwh_carro and tarifa) else None
            faturas.append({
                "mes": mes,
                "venc": parse_date(r.get("Vencimento", "")),
                "kwh_total": kwh_total,
                "valor_total": valor_total,
                "kwh_carro": kwh_carro,
                "custo_carro": custo_carro,
                "tarifa": tarifa,
                "bandeira": str(r.get("Bandeira", "")).strip(),
                "obs": str(r.get("Observação", "")).strip(),
            })

    payload = {
        "updated_at": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "carregamentos": carregamentos,
        "postos": postos,
        "medidor": medidor,
        "faturas": faturas,
    }

    json_str = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))

    html_path = os.path.join(os.path.dirname(__file__), "dashboard.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    new_data_line = f"const DATA = {json_str};"
    html = re.sub(
        r"const DATA\s*=\s*\{[^;]*\};",
        new_data_line,
        html,
        flags=re.DOTALL,
    )

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"✓ Data injected: {len(carregamentos)} cargas em casa, "
          f"{len(postos)} cargas em postos, {len(medidor)} leituras de medidor, "
          f"{len(faturas)} faturas.")
    print(f"  Updated at: {payload['updated_at']}")


if __name__ == "__main__":
    main()
