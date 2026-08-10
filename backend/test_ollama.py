"""Standalone smoke test for the local Ollama + Llama 3 connection.

Run: python3 test_ollama.py
"""

import json
import sys
import urllib.request

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3"


def main():
    payload = {
        "model": MODEL,
        "prompt": "Say hello in exactly five words.",
        "stream": False,
    }
    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
            print("Model response:", data.get("response", "").strip())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 404:
            print(f"Model '{MODEL}' not found yet — still downloading? Run `ollama list` to check.")
        else:
            print(f"HTTP {e.code}: {body}")
        sys.exit(1)
    except urllib.error.URLError:
        print("Cannot reach Ollama at localhost:11434 — is `ollama serve` running?")
        sys.exit(1)


if __name__ == "__main__":
    main()
