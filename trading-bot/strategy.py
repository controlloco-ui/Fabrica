"""Estrategia: asignación fija de ETFs con filtro de tendencia (media móvil).

Cada activo recibe su peso objetivo solo si su precio está por encima de su
media móvil de N días; si no, esa parte queda en efectivo (o en el activo
refugio, si se configuró). Es una estrategia lenta: opera pocas veces al mes
y busca evitar las grandes caídas, no ganar todos los días.
"""


def sma(prices, window):
    """Media móvil simple de los últimos `window` precios (None si faltan datos)."""
    if window <= 0 or len(prices) < window:
        return None
    return sum(prices[-window:]) / window


def target_weights(closes_by_symbol, allocation, sma_window, safe_asset=None):
    """Pesos objetivo (0..1) por símbolo según el filtro de tendencia.

    closes_by_symbol: {símbolo: [cierres diarios, del más viejo al más nuevo]}
    allocation: {símbolo: peso}; los pesos deben sumar <= 1
    safe_asset: símbolo que recibe los pesos de los activos en tendencia bajista
    """
    weights = {}
    parked = 0.0
    for symbol, weight in allocation.items():
        closes = closes_by_symbol.get(symbol) or []
        average = sma(closes, sma_window)
        if average is not None and closes[-1] > average:
            weights[symbol] = weights.get(symbol, 0.0) + weight
        else:
            weights.setdefault(symbol, 0.0)
            parked += weight
    if safe_asset and parked > 0:
        weights[safe_asset] = weights.get(safe_asset, 0.0) + parked
    return weights


def rebalance_orders(equity, positions, prices, weights, min_drift, min_order):
    """Órdenes en dólares para acercar la cartera a los pesos objetivo.

    positions: {símbolo: valor de mercado actual en USD}
    Devuelve [(símbolo, 'buy'|'sell', monto_usd)], ventas primero para liberar
    efectivo. Solo opera si el desvío supera `min_drift` (fracción del capital)
    o si hay que salir/entrar por completo, y nunca por menos de `min_order`.
    """
    orders = []
    for symbol in sorted(set(weights) | set(positions)):
        if symbol not in prices:
            continue
        current = positions.get(symbol, 0.0)
        target = equity * weights.get(symbol, 0.0)
        diff = target - current
        full_exit = target == 0 and current > 0
        full_entry = current == 0 and target > 0
        if abs(diff) < min_order:
            continue
        if not (full_exit or full_entry) and abs(diff) < equity * min_drift:
            continue
        orders.append((symbol, "buy" if diff > 0 else "sell", round(abs(diff), 2)))
    orders.sort(key=lambda o: o[1] != "sell")
    return orders
