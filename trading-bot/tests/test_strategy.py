import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from bot import run  # noqa: E402
from strategy import rebalance_orders, sma, target_weights  # noqa: E402


def test_sma():
    assert sma([1, 2, 3, 4], 2) == 3.5
    assert sma([1, 2], 3) is None


def test_target_weights_parks_downtrend_in_safe_asset():
    closes = {"UP": [1, 2, 3, 4], "DOWN": [4, 3, 2, 1]}
    weights = target_weights(closes, {"UP": 0.6, "DOWN": 0.4}, 3, safe_asset="SAFE")
    assert weights == {"UP": 0.6, "DOWN": 0.0, "SAFE": 0.4}


def test_target_weights_without_data_goes_to_cash():
    assert target_weights({}, {"X": 1.0}, 3) == {"X": 0.0}


def test_rebalance_ignores_small_drift_and_sells_first():
    prices = {"A": 1, "B": 1}
    assert rebalance_orders(1000, {"A": 510, "B": 490}, prices, {"A": 0.5, "B": 0.5}, 0.05, 5) == []
    orders = rebalance_orders(1000, {"A": 1000}, prices, {"A": 0.0, "B": 1.0}, 0.05, 5)
    assert orders == [("A", "sell", 1000.0), ("B", "buy", 1000.0)]


class FakeClient:
    def __init__(self, is_open=True):
        self.is_open = is_open
        self.sent = []

    def account(self):
        return {"equity": "5000"}

    def clock(self):
        return {"is_open": self.is_open}

    def open_orders(self):
        return []

    def positions(self):
        return [{"symbol": "OLD", "market_value": "100"}]

    def daily_closes(self, symbols, days):
        return {s: [1, 2, 3, 4] for s in symbols}

    def submit_notional_order(self, symbol, side, notional):
        self.sent.append((symbol, side, notional))

    def close_position(self, symbol):
        self.sent.append((symbol, "close", None))


CONFIG = {"allocation": {"A": 0.5, "B": 0.5}, "sma_window": 3, "max_invested_usd": 1000}


def test_run_caps_capital_and_ignores_foreign_positions():
    client = FakeClient()
    orders = run(client, CONFIG, send_orders=True, log=lambda *_: None)
    assert orders == [("A", "buy", 500.0), ("B", "buy", 500.0)]
    assert client.sent == orders


def test_dry_run_and_closed_market_send_nothing():
    client = FakeClient()
    run(client, CONFIG, send_orders=False, log=lambda *_: None)
    assert client.sent == []
    closed = FakeClient(is_open=False)
    assert run(closed, CONFIG, send_orders=True, log=lambda *_: None) == []
