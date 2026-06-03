from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


BASE_URL = os.environ.get("AI_BASE_URL", "https://api.aispeeded.com/v1").rstrip("/")
API_KEY = os.environ.get("AI_API_KEY", "")
MODEL = os.environ.get("AI_MODEL", "claude-opus-4-8")
API_FORMAT = os.environ.get("AI_API_FORMAT", "chat_completions").strip().lower()
ANTHROPIC_VERSION = os.environ.get("ANTHROPIC_VERSION", "2023-06-01")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hycpfpbetwiubixkhbet.supabase.co").rstrip("/")
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_VCyjYDSE3CCDNu_tGS4wdw_s4xyZ5qZ")
REQUIRE_AI_AUTH = os.environ.get("REQUIRE_AI_AUTH", "1" if os.environ.get("VERCEL") else "0").strip().lower() in {"1", "true", "yes", "on"}
ROOT = Path(__file__).resolve().parent
LOG_FILE = ROOT / "家庭账本整理台_AI日志.txt"


class FinanceHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path not in {"/api/parse-training", "/api/review-transactions"}:
            self.send_error(404, "Not found")
            return

        if not API_KEY:
            log_ai_event(f"{path} rejected: AI_API_KEY is not set")
            self.write_json({"ok": False, "error": "AI_API_KEY is not set"}, status=503)
            return

        if not ensure_ai_request_authorized(self, path):
            return

        try:
            payload = self.read_json_body()
            if path == "/api/parse-training":
                parsed = ask_ai_to_parse(payload)
                self.write_json({"ok": True, "model": MODEL, "parsed": parsed})
            else:
                reviews = ask_ai_to_review_transactions(payload)
                self.write_json({"ok": True, "model": MODEL, "reviews": reviews})
        except Exception as exc:
            log_ai_event(f"{path} failed: {type(exc).__name__}: {str(exc)[:500]}")
            self.write_json({"ok": False, "error": str(exc)}, status=502)

    def do_GET(self):
        if self.path.split("?", 1)[0] == "/api/list-bills":
            files = list_bill_files()
            self.write_json({"ok": True, "files": files})
            return
        super().do_GET()

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
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def ai_url(path):
    suffix = path if path.startswith("/") else f"/{path}"
    if BASE_URL.endswith("/v1"):
        return f"{BASE_URL}{suffix}"
    return f"{BASE_URL}/v1{suffix}"


def ensure_ai_request_authorized(handler, path):
    if not REQUIRE_AI_AUTH:
        return True

    auth_header = handler.headers.get("Authorization", "")
    token = auth_header.split(" ", 1)[1].strip() if auth_header.lower().startswith("bearer ") else ""
    if not token:
        log_ai_event(f"{path} rejected: missing auth token")
        handler.write_json({"ok": False, "error": "Login required for AI features"}, status=401)
        return False

    if verify_supabase_token(token):
        return True

    log_ai_event(f"{path} rejected: invalid auth token")
    handler.write_json({"ok": False, "error": "Invalid login session"}, status=401)
    return False


def verify_supabase_token(token):
    if not SUPABASE_URL or not SUPABASE_PUBLISHABLE_KEY:
        return False
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "Authorization": f"Bearer {token}",
            "apikey": SUPABASE_PUBLISHABLE_KEY,
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            return 200 <= res.status < 300
    except Exception as exc:
        log_ai_event(f"auth verify failed: {type(exc).__name__}: {str(exc)[:200]}")
        return False


def log_ai_event(message):
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with LOG_FILE.open("a", encoding="utf-8") as file:
            file.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass


def ai_endpoint():
    if API_FORMAT in {"anthropic", "anthropic_messages", "messages"}:
        return ai_url("/messages")
    return ai_url("/chat/completions")


def to_anthropic_messages(request_body):
    system_parts = []
    messages = []
    for item in request_body.get("messages", []):
        role = item.get("role")
        content = item.get("content", "")
        if role == "system":
            system_parts.append(str(content))
        elif role in {"user", "assistant"}:
            messages.append({"role": role, "content": str(content)})

    converted = {
        "model": request_body.get("model", MODEL),
        "max_tokens": request_body.get("max_tokens", 1024),
        "temperature": request_body.get("temperature", 0),
        "messages": messages,
    }
    if system_parts:
        converted["system"] = "\n\n".join(system_parts)
    return converted


def extract_ai_content(response):
    if API_FORMAT in {"anthropic", "anthropic_messages", "messages"}:
        content = response.get("content", [])
        if isinstance(content, list):
            return "".join(
                str(part.get("text", ""))
                for part in content
                if isinstance(part, dict) and part.get("type") == "text"
            )
        return str(content)
    return response["choices"][0]["message"]["content"]


def post_ai_chat(request_body, timeout, purpose):
    endpoint = ai_endpoint()
    outbound_body = to_anthropic_messages(request_body) if API_FORMAT in {"anthropic", "anthropic_messages", "messages"} else request_body
    data = json.dumps(outbound_body, ensure_ascii=True).encode("utf-8")

    for attempt in range(1, 3):
        log_ai_event(f"{purpose}: POST {endpoint} format={API_FORMAT} model={MODEL} attempt={attempt}")
        req = urllib.request.Request(
            endpoint,
            data=data,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json; charset=utf-8",
                **({"anthropic-version": ANTHROPIC_VERSION} if API_FORMAT in {"anthropic", "anthropic_messages", "messages"} else {}),
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                response_text = res.read().decode("utf-8")
                log_ai_event(f"{purpose}: HTTP {res.status} ok attempt={attempt}")
                return json.loads(response_text)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            log_ai_event(f"{purpose}: AI HTTP {exc.code} attempt={attempt}: {detail[:500]}")
            if exc.code < 500 or attempt >= 2:
                raise RuntimeError(f"AI HTTP {exc.code}: {detail[:500]}") from exc
        except Exception as exc:
            log_ai_event(f"{purpose}: request error {type(exc).__name__} attempt={attempt}: {str(exc)[:500]}")
            if attempt >= 2:
                raise

        time.sleep(0.7)

    raise RuntimeError("AI request failed")


def ask_ai_to_parse(payload):
    text = str(payload.get("text", "")).strip()
    today = str(payload.get("today", "")).strip()
    categories = payload.get("categories") or []

    request_body = {
        "model": MODEL,
        "temperature": 0,
        "max_tokens": 350,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You parse Chinese personal finance training commands. "
                    "Return strict JSON only, no markdown. "
                    "Never invent a merchant, keyword, category, date, or amount. "
                    "The keyword must be an exact substring copied from the command, or null. "
                    "Use category ids from the provided list only."
                ),
            },
            {
                "role": "user",
                "content": build_prompt(text, today, categories),
            },
        ],
    }
    response = post_ai_chat(request_body, timeout=35, purpose="parse-training")
    content = extract_ai_content(response)
    return normalize_ai_json(content)


def build_prompt(text, today, categories):
    category_lines = "\n".join(
        f"- {item.get('id')}: {item.get('name')} aliases={item.get('aliases', [])}"
        for item in categories
    )
    return f"""
Current date: {today}

Categories:
{category_lines}

Command:
{text}

Return this JSON shape:
{{
  "type": "daily" | "fixed" | "unknown",
  "date": "YYYY-MM-DD" | null,
  "amount": number | null,
  "category": "category id" | null,
  "keyword": "merchant or keyword" | null,
  "missing": ["date" | "amount" | "category" | "keyword"],
  "confidence": number
}}

Interpretation rules:
- "fixed" means a permanent merchant/counterparty/category rule, such as fixed, 以后, 之后, 每次, 商户, 对手方, 固定为.
- "daily" means one specific consumption memory for a date and amount.
- If date is not stated but the command says 今天, 刚刚, or 刚才, use Current date.
- If no date is stated for a normal one-time consumption, use Current date.
- For fixed rules, amount and date should be null.
- For daily memories, keyword is optional.
- If keyword is not explicitly present in Command, use null. Never use a brand or merchant not present in Command.
- Mentions of friends eating, 聚餐, 请客, 饭局, or 餐饮 over 100 usually indicate category social.
- If a required field is unclear, set it to null and include it in missing.
""".strip()


def normalize_ai_json(content):
    text = content.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = json.loads(extract_first_json_object(text))
    keyword = data.get("keyword") or None
    if isinstance(keyword, str) and re.fullmatch(r"[\?\s]+", keyword):
        keyword = None

    return {
        "type": data.get("type") if data.get("type") in {"daily", "fixed", "unknown"} else "unknown",
        "date": data.get("date") or None,
        "amount": data.get("amount") if isinstance(data.get("amount"), (int, float)) else None,
        "category": data.get("category") or None,
        "keyword": keyword,
        "missing": data.get("missing") if isinstance(data.get("missing"), list) else [],
        "confidence": data.get("confidence") if isinstance(data.get("confidence"), (int, float)) else 0,
    }


def ask_ai_to_review_transactions(payload):
    categories = payload.get("categories") or []
    transactions = (payload.get("transactions") or [])[:60]
    category_ids = {str(item.get("id")) for item in categories if item.get("id")}
    allowed_ids = {str(item.get("id")) for item in transactions if item.get("id")}
    if not transactions:
        return []

    request_body = {
        "model": MODEL,
        "temperature": 0,
        "max_tokens": 2200,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You review Chinese household finance transactions for category suggestions. "
                    "Return strict JSON only, no markdown. "
                    "Use only provided transaction ids and category ids. "
                    "Do not invent merchants, facts, or categories. "
                    "If unsure, use category uncertain with low confidence."
                ),
            },
            {
                "role": "user",
                "content": build_review_prompt(categories, transactions),
            },
        ],
    }
    response = post_ai_chat(request_body, timeout=45, purpose="review-transactions")
    content = extract_ai_content(response)
    return normalize_review_json(content, allowed_ids, category_ids)


def build_review_prompt(categories, transactions):
    category_lines = "\n".join(
        f"- {item.get('id')}: {item.get('name')}"
        for item in categories
    )
    tx_lines = "\n".join(
        (
            f"- id={item.get('id')}；日期={item.get('date')}；金额={item.get('amount')}；"
            f"商户/对方={item.get('merchant') or ''}；摘要={item.get('summary') or ''}；"
            f"用途={item.get('purpose') or ''}；渠道={item.get('channel') or ''}"
        )
        for item in transactions
    )
    return f"""
可选分类：
{category_lines}

交易明细：
{tx_lines}

只返回下面这个 JSON 结构，不要 markdown，不要额外解释：
{{
  "reviews": [
    {{
      "id": "transaction id",
      "category": "category id",
      "confidence": 0-100,
      "reason": "short Chinese reason based only on transaction text"
    }}
  ]
}}

分类规则：
- rigid：水电燃气、物业、房租、通讯、贷款等固定或刚性家庭账单。
- social：100 元以上餐饮、朋友聚餐、请客、应酬、社交饭局。
- child：孩子、学校、幼儿园、玩具、培训、图书、母婴相关支出。
- travelFun：差旅、打车、停车、酒店、交通票务、电影、演出、旅游、娱乐。
- daily：普通购物、零食、超市、日用品、药品、小额日常消费。
- financial：转账、还款、信用卡还款、非消费资金流动。
- refund：退款或收入。

判断要求：
- 尽量每条交易返回一个 review。
- category 必须使用可选分类里的 id。
- 餐饮金额大于 100 且出现朋友、聚餐、请客、饭局、火锅、餐厅等线索时，优先判断为 social。
- 证据弱时 confidence 低于 70，并可用 uncertain。
- reason 用简短中文说明依据。
""".strip()


def normalize_review_json(content, allowed_ids, category_ids):
    text = content.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = json.loads(extract_first_json_object(text))

    reviews = data.get("reviews") if isinstance(data, dict) else []
    if not isinstance(reviews, list):
        return []

    normalized = []
    seen = set()
    for item in reviews:
        if not isinstance(item, dict):
            continue
        tx_id = str(item.get("id") or "")
        category = str(item.get("category") or "")
        if tx_id not in allowed_ids or tx_id in seen or category not in category_ids:
            continue
        confidence = item.get("confidence")
        if not isinstance(confidence, (int, float)):
            confidence = 0
        normalized.append(
            {
                "id": tx_id,
                "category": category,
                "confidence": max(0, min(100, float(confidence))),
                "reason": str(item.get("reason") or "")[:120],
            }
        )
        seen.add(tx_id)
    return normalized


def extract_first_json_object(text):
    start = text.find("{")
    if start < 0:
        raise ValueError("AI did not return JSON")

    depth = 0
    in_string = False
    escape = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start:index + 1]

    raise ValueError("AI did not return complete JSON")


def list_bill_files():
    roots = [ROOT / "账单文件夹", ROOT]
    seen = set()
    files = []
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".xls", ".xlsx", ".csv"}:
                continue
            rel = path.relative_to(ROOT).as_posix()
            if rel not in seen:
                seen.add(rel)
                files.append(rel)
    return files


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = ThreadingHTTPServer(("127.0.0.1", port), FinanceHandler)
    print(f"Serving http://127.0.0.1:{port}/index.html")
    server.serve_forever()


if __name__ == "__main__":
    main()
