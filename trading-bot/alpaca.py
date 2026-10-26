"""Cliente mínimo de la API REST de Alpaca (bróker sin comisiones, con cuenta paper)."""

import datetime as dt

import requests

PAPER_URL = "https://paper-api.alpaca.markets"
LIVE_URL = "https://api.alpaca.markets"
DATA_URL = "https://data.alpaca.markets"


class AlpacaError(RuntimeError):
    pass


class Alpaca:
    def __init__(self, key_id, secret_key, live=False, timeout=20):
        self.base = LIVE_URL if live else PAPER_URL
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "APCA-API-KEY-ID": key_id,
            "APCA-API-SECRET-KEY": secret_key,
        })

    def _request(self, method, url, **kwargs):
        response = self.session.request(method, url, timeout=self.timeout, **kwargs)
        if response.status_code >= 400:
            raise AlpacaError(f"{method} {url} -> {response.status_code}: {response.text}")
        return response.json() if response.content else None

    def account(self):
        return self._request("GET", f"{self.base}/v2/account")

    def clock(self):
        return self._request("GET", f"{self.base}/v2/clock")

    def positions(self):
        return self._request("GET", f"{self.base}/v2/positions")

    def open_orders(self):
        return self._request("GET", f"{self.base}/v2/orders", params={"status": "open"})

    def submit_notional_order(self, symbol, side, notional):
        return self._request("POST", f"{self.base}/v2/orders", json={
            "symbol": symbol,
            "side": side,
            "type": "market",
            "time_in_force": "day",
            "notional": f"{notional:.2f}",
        })

    def close_position(self, symbol):
        return self._request("DELETE", f"{self.base}/v2/positions/{symbol}")

    def daily_closes(self, symbols, days):
        """{símbolo: [cierres ajustados]} de los últimos `days` días naturales (feed IEX gratuito)."""
        start = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)).strftime("%Y-%m-%d")
        closes = {s: [] for s in symbols}
        params = {
            "symbols": ",".join(symbols),
            "timeframe": "1Day",
            "start": start,
            "adjustment": "all",
            "feed": "iex",
            "limit": 10000,
        }
        while True:
            data = self._request("GET", f"{DATA_URL}/v2/stocks/bars", params=params)
            for symbol, bars in (data.get("bars") or {}).items():
                closes[symbol].extend(bar["c"] for bar in bars)
            token = data.get("next_page_token")
            if not token:
                return closes
            params["page_token"] = token
