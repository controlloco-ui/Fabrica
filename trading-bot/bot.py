"""Bot de inversión automatizado sobre Alpaca.

Modos (variable BOT_MODE):
  dry-run  (por defecto) calcula y muestra las órdenes, no envía nada
  paper    opera en la cuenta de práctica de Alpaca (dinero ficticio)
  live     opera con dinero real; exige además LIVE_CONFIRM=ENTIENDO_EL_RIESGO

Credenciales: ALPACA_KEY_ID y ALPACA_SECRET_KEY (de la cuenta paper o live).
"""

import json
import os
import sys
from pathlib import Path

from alpaca import Alpaca
from strategy import rebalance_orders, target_weights

LIVE_CONFIRMATION = "ENTIENDO_EL_RIESGO"


def load_config(path):
    config = json.loads(Path(path).read_text(encoding="utf-8"))
    total = sum(config["allocation"].values())
    if total > 1.0001:
        raise ValueError(f"Los pesos de 'allocation' suman {total:.2f}; deben sumar <= 1")
    return config


def run(client, config, send_orders, log=print):
    account = client.account()
    if account.get("trading_blocked") or account.get("account_blocked"):
        log("La cuenta está bloqueada para operar; no hago nada.")
        return []

    equity = float(account["equity"])
    log(f"Capital de la cuenta: ${equity:,.2f}")
    halt_below = config.get("halt_if_equity_below_usd") or 0
    if equity < halt_below:
        log(f"Capital por debajo del límite de seguridad (${halt_below:,.2f}); bot detenido.")
        return []

    if not client.clock().get("is_open"):
        log("El mercado está cerrado; no hay nada que hacer hoy.")
        return []
    if client.open_orders():
        log("Hay órdenes pendientes de una ejecución anterior; espero a que se completen.")
        return []

    allocation = config["allocation"]
    safe_asset = config.get("safe_asset")
    universe = sorted(set(allocation) | ({safe_asset} if safe_asset else set()))
    window = config["sma_window"]
    closes = client.daily_closes(universe, days=int(window * 1.6) + 30)
    weights = target_weights(closes, allocation, window, safe_asset)

    positions = {
        p["symbol"]: float(p["market_value"])
        for p in client.positions()
        if p["symbol"] in universe
    }
    capital = min(equity, config.get("max_invested_usd") or equity)
    prices = {s: c[-1] for s, c in closes.items() if c}

    for symbol in universe:
        trend = "sin datos"
        if symbol in allocation and closes.get(symbol):
            trend = "alcista" if weights.get(symbol, 0) > 0 else "bajista -> efectivo/refugio"
        elif symbol == safe_asset:
            trend = "refugio"
        log(f"  {symbol:5} objetivo {weights.get(symbol, 0):6.1%}  "
            f"actual ${positions.get(symbol, 0):10,.2f}  ({trend})")

    orders = rebalance_orders(
        capital, positions, prices, weights,
        min_drift=config.get("min_drift", 0.05),
        min_order=config.get("min_order_usd", 5),
    )
    if not orders:
        log("La cartera ya está alineada; sin órdenes hoy.")
        return []

    for symbol, side, amount in orders:
        full_exit = side == "sell" and weights.get(symbol, 0) == 0
        label = "cerrar posición" if full_exit else f"{side} ${amount:,.2f}"
        if not send_orders:
            log(f"[simulación] {symbol}: {label}")
            continue
        if full_exit:
            client.close_position(symbol)
        else:
            client.submit_notional_order(symbol, side, amount)
        log(f"Orden enviada {symbol}: {label}")
    return orders


def main():
    mode = os.environ.get("BOT_MODE", "dry-run").strip().lower()
    if mode not in ("dry-run", "paper", "live"):
        sys.exit(f"BOT_MODE desconocido: {mode!r} (usa dry-run, paper o live)")
    if mode == "live" and os.environ.get("LIVE_CONFIRM") != LIVE_CONFIRMATION:
        sys.exit(f"Para operar con dinero real define LIVE_CONFIRM={LIVE_CONFIRMATION}")

    key_id = os.environ.get("ALPACA_KEY_ID")
    secret = os.environ.get("ALPACA_SECRET_KEY")
    if not key_id or not secret:
        sys.exit("Faltan ALPACA_KEY_ID y ALPACA_SECRET_KEY")

    config_path = os.environ.get("BOT_CONFIG", Path(__file__).with_name("config.json"))
    config = load_config(config_path)
    print(f"Modo: {mode}")
    client = Alpaca(key_id, secret, live=(mode == "live"))
    run(client, config, send_orders=(mode != "dry-run"))


if __name__ == "__main__":
    main()
