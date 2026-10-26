# Bot de inversión automatizado (`trading-bot/`)

Bot que invierte solo en ETFs de EE. UU. a través de [Alpaca](https://alpaca.markets) (bróker sin comisiones con cuenta de práctica gratuita) y se ejecuta gratis todos los días hábiles con GitHub Actions. No necesitás tener la compu prendida.

> **Aviso honesto:** ningún bot garantiza ganancias, ni $1 por día. Los bots de *day trading* que prometen ganancias diarias pierden dinero en la gran mayoría de los casos (comisiones, spreads y la regla PDT de EE. UU. que limita operar intradía con menos de USD 25.000). Este bot hace algo más modesto y realista: invierte a largo plazo y **se sale a efectivo cuando el mercado entra en tendencia bajista**, para intentar esquivar las grandes caídas. Habrá meses en pérdida. Empezá siempre en modo práctica y solo invertí dinero que puedas perder.

## Qué hace

1. Reparte el capital según `config.json` (por defecto 60 % SPY, 20 % QQQ, 20 % GLD).
2. Cada activo solo se mantiene si su precio está **por encima de su media de 200 días**; si cae por debajo, esa parte pasa a `SGOV` (letras del Tesoro, ~4-5 % anual) o a efectivo.
3. Rebalancea solo cuando la cartera se desvía más de un 5 %, así que opera pocas veces al mes.
4. Nunca usa más de `max_invested_usd` (por defecto USD 1.000) aunque la cuenta tenga más, e ignora otras posiciones que tengas.
5. Si el capital cae por debajo de `halt_if_equity_below_usd`, deja de operar.

## Puesta en marcha (15 minutos)

1. Creá una cuenta en [alpaca.markets](https://alpaca.markets). La cuenta **Paper** (dinero ficticio) es gratis y alcanza con un email; para dinero real Alpaca acepta residentes de muchos países, incluida Argentina (verificá requisitos al registrarte).
2. En el panel de Paper Trading generá las claves de API.
3. En GitHub: *Settings → Secrets and variables → Actions*:
   - **Secrets**: `ALPACA_KEY_ID` y `ALPACA_SECRET_KEY`.
   - **Variables**: `BOT_MODE` = `paper` (o `dry-run` para solo ver qué haría).
4. Listo. El workflow *Bot de inversión* corre de lunes a viernes antes del cierre del mercado. Podés lanzarlo a mano desde la pestaña *Actions → Bot de inversión → Run workflow* y ver el registro.

### Pasar a dinero real (cuando lo hayas visto funcionar varias semanas)

- Generá claves de la cuenta **live** y reemplazá los secrets.
- Variables: `BOT_MODE` = `live` y `LIVE_CONFIRM` = `ENTIENDO_EL_RIESGO`.
- Ajustá `max_invested_usd` en `config.json` a lo que estés dispuesto a arriesgar.

## Probar en tu compu

```bash
cd trading-bot
pip install -r requirements.txt pytest
python -m pytest -q tests
export ALPACA_KEY_ID=... ALPACA_SECRET_KEY=...
python bot.py                      # dry-run: muestra órdenes, no envía nada
BOT_MODE=paper python bot.py       # opera en la cuenta de práctica
python backtest.py --alpaca 3000   # backtest con ~8 años de datos vs. comprar y mantener
python backtest.py precios.csv     # o con un CSV propio: date,SPY,QQQ,GLD,SGOV
```

## Configuración (`config.json`)

| Clave | Qué es |
|---|---|
| `allocation` | Símbolos y pesos (deben sumar ≤ 1) |
| `safe_asset` | Dónde va lo que sale del mercado (`""` = efectivo) |
| `sma_window` | Días de la media móvil del filtro de tendencia |
| `min_drift` | Desvío mínimo (fracción) para rebalancear |
| `min_order_usd` | Orden mínima en USD (Alpaca acepta desde $1, así que funciona con cuentas de $10) |
| `max_invested_usd` | Tope de capital que maneja el bot |
| `halt_if_equity_below_usd` | Freno de emergencia (0 = desactivado) |

## Archivos

- `strategy.py` — lógica pura de la estrategia (sin red, testeada).
- `alpaca.py` — cliente REST mínimo de Alpaca (órdenes y datos diarios IEX gratuitos).
- `bot.py` — ejecución diaria con modos `dry-run` / `paper` / `live`.
- `backtest.py` — simulación histórica con costes.
- `../.github/workflows/trading-bot.yml` — tests en cada push y ejecución programada.
