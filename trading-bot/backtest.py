"""Backtest de la estrategia con cierres diarios históricos.

Uso:
  python backtest.py datos.csv            # CSV con columnas: date,SPY,QQQ,GLD,SGOV...
  python backtest.py --alpaca 3000        # descarga ~3000 días de Alpaca (requiere claves)

Compara contra comprar y mantener la misma asignación sin filtro.
Recuerda: el rendimiento pasado no garantiza resultados futuros.
"""

import csv
import json
import os
import sys
from pathlib import Path

from strategy import rebalance_orders, target_weights


def load_csv(path):
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    symbols = [c for c in rows[0] if c.lower() != "date"]
    return {s: [float(r[s]) for r in rows] for s in symbols}


def simulate(closes, config, use_filter=True, start_cash=10_000.0, cost=0.0005):
    allocation = config["allocation"]
    safe = config.get("safe_asset") if use_filter else None
    window = config["sma_window"]
    days = min(len(c) for c in closes.values())
    cash, shares, curve, trades = start_cash, {}, [], 0
    for day in range(window, days):
        history = {s: c[: day + 1] for s, c in closes.items()}
        prices = {s: c[day] for s, c in closes.items()}
        equity = cash + sum(q * prices[s] for s, q in shares.items())
        weights = (target_weights(history, allocation, window, safe)
                   if use_filter else dict(allocation))
        positions = {s: q * prices[s] for s, q in shares.items() if q}
        for symbol, side, amount in rebalance_orders(
                equity, positions, prices, weights, config.get("min_drift", 0.05), 1):
            if side == "sell":
                amount = min(amount, positions.get(symbol, 0))
            else:
                amount = min(amount, cash / (1 + cost))
            qty = amount / prices[symbol]
            shares[symbol] = shares.get(symbol, 0) + (qty if side == "buy" else -qty)
            cash += -amount * (1 + cost) if side == "buy" else amount * (1 - cost)
            trades += 1
        curve.append(cash + sum(q * prices[s] for s, q in shares.items()))
    return curve, trades


def stats(curve):
    years = len(curve) / 252
    cagr = (curve[-1] / curve[0]) ** (1 / years) - 1 if years > 0 else 0
    peak, max_dd = curve[0], 0.0
    for value in curve:
        peak = max(peak, value)
        max_dd = max(max_dd, 1 - value / peak)
    return cagr, max_dd


def main():
    config = json.loads(Path(__file__).with_name("config.json").read_text(encoding="utf-8"))
    args = sys.argv[1:]
    if args[:1] == ["--alpaca"]:
        from alpaca import Alpaca
        client = Alpaca(os.environ["ALPACA_KEY_ID"], os.environ["ALPACA_SECRET_KEY"])
        symbols = sorted(set(config["allocation"]) | ({config["safe_asset"]} if config.get("safe_asset") else set()))
        closes = client.daily_closes(symbols, days=int(args[1]) if len(args) > 1 else 3000)
    elif args:
        closes = load_csv(args[0])
    else:
        sys.exit(__doc__)
    # Alinear series de distinta longitud por el final
    length = min(len(c) for c in closes.values())
    closes = {s: c[-length:] for s, c in closes.items()}

    for name, use_filter in (("Estrategia con filtro", True), ("Comprar y mantener", False)):
        curve, trades = simulate(closes, config, use_filter)
        cagr, max_dd = stats(curve)
        print(f"{name:22} final ${curve[-1]:>10,.0f}  anual {cagr:6.1%}  "
              f"caída máx {max_dd:6.1%}  operaciones {trades}")


if __name__ == "__main__":
    main()
