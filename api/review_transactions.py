from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler

import server


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if not server.API_KEY:
            self.write_json({"ok": False, "error": "AI_API_KEY is not set"}, status=503)
            return

        if not server.ensure_ai_request_authorized(self, "/api/review-transactions"):
            return

        try:
            payload = self.read_json_body()
            reviews = server.ask_ai_to_review_transactions(payload)
            self.write_json({"ok": True, "model": server.MODEL, "reviews": reviews})
        except Exception as exc:
            server.log_ai_event(f"/api/review-transactions failed: {type(exc).__name__}: {str(exc)[:500]}")
            self.write_json({"ok": False, "error": str(exc)}, status=502)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 262144:
            raise ValueError("Request body is too large")
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def write_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
