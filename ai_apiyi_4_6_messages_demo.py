from __future__ import annotations

"""
Standalone APIyi Anthropic Messages demo.

PowerShell:
  $env:AI_API_KEY="your_api_key_here"
  python ai_apiyi_4_6_messages_demo.py

Optional:
  $env:AI_BASE_URL="https://api.apiyi.com/v1"
  $env:AI_MODEL="claude-opus-4-6"
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request


BASE_URL = os.environ.get("AI_BASE_URL", "https://api.apiyi.com/v1").rstrip("/")
API_KEY = os.environ.get("AI_API_KEY", "").strip()
MODEL = os.environ.get("AI_MODEL", "claude-opus-4-6")
ANTHROPIC_VERSION = os.environ.get("ANTHROPIC_VERSION", "2023-06-01")


def ai_url(path: str) -> str:
    suffix = path if path.startswith("/") else f"/{path}"
    if BASE_URL.endswith("/v1"):
        return f"{BASE_URL}{suffix}"
    return f"{BASE_URL}/v1{suffix}"


def messages_completion(system: str, user_content: str, max_tokens=800, temperature=0):
    if not API_KEY:
        raise RuntimeError(
            "AI_API_KEY is not set. Run this first:\n"
            "$env:AI_API_KEY='your_api_key_here'"
        )

    endpoint = ai_url("/messages")
    body = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "system": system,
        "messages": [
            {
                "role": "user",
                "content": user_content,
            }
        ],
    }

    # ASCII escaping is friendlier to some proxy gateways while preserving Chinese semantics.
    data = json.dumps(body, ensure_ascii=True).encode("utf-8")

    for attempt in range(1, 3):
        request = urllib.request.Request(
            endpoint,
            data=data,
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json; charset=utf-8",
                "anthropic-version": ANTHROPIC_VERSION,
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                result = json.loads(response.read().decode("utf-8"))
                return extract_text(result)
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            print(f"AI HTTP {exc.code}, attempt={attempt}: {detail[:500]}", file=sys.stderr)
            if exc.code < 500 or attempt >= 2:
                raise
        except Exception as exc:
            print(f"AI request error, attempt={attempt}: {exc}", file=sys.stderr)
            if attempt >= 2:
                raise

        time.sleep(0.7)

    raise RuntimeError("AI request failed")


def extract_text(result):
    content = result.get("content", [])
    if isinstance(content, list):
        return "".join(
            str(part.get("text", ""))
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        )
    return str(content)


def demo_training_parse():
    system = (
        "你是家庭账本训练助手。只返回 JSON，不要 markdown。"
        "根据用户一句话识别 date, amount, category, keyword。"
    )
    user_content = """
当前日期：2026-06-02

可选分类：
- social: 社交支出
- daily: 日常消费
- child: 育儿支出
- rigid: 刚性支出
- travelFun: 差旅/娱乐

用户输入：
今天200元社交支出

只返回：
{
  "type": "daily" | "fixed" | "unknown",
  "date": "YYYY-MM-DD" | null,
  "amount": number | null,
  "category": "category id" | null,
  "keyword": string | null,
  "missing": [],
  "confidence": number
}
""".strip()
    return messages_completion(system, user_content, max_tokens=500)


def demo_transaction_review():
    system = "你是家庭账本分类助手。只返回 JSON，不要 markdown。category 必须使用给定 id。"
    user_content = """
可选分类：
- social: 社交支出
- daily: 日常消费
- child: 育儿支出
- rigid: 刚性支出
- travelFun: 差旅/娱乐
- uncertain: 待确认

交易明细：
- id=t1；日期=2026-06-02；金额=200；商户/对方=海底捞火锅；摘要=朋友聚餐餐饮消费；渠道=支付宝

判断要求：
- 100 元以上餐饮、朋友聚餐、请客、饭局，优先判断为 social。
- 证据弱时使用 uncertain，confidence 低于 70。

只返回：
{
  "reviews": [
    {
      "id": "transaction id",
      "category": "category id",
      "confidence": 0-100,
      "reason": "简短中文原因"
    }
  ]
}
""".strip()
    return messages_completion(system, user_content, max_tokens=800)


if __name__ == "__main__":
    print("BASE_URL:", BASE_URL)
    print("MODEL:", MODEL)
    print("ENDPOINT:", ai_url("/messages"))
    print("ANTHROPIC_VERSION:", ANTHROPIC_VERSION)
    print()

    print("=== Training Parse Demo ===")
    print(demo_training_parse())
    print()

    print("=== Transaction Review Demo ===")
    print(demo_transaction_review())
