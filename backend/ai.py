import os
import json
import time
from google import genai
from google.genai import errors as genai_errors
from dotenv import load_dotenv

load_dotenv()

MODEL = "gemini-2.5-flash-lite" 
_client = None

# Retry settings for rate-limit (429) errors
_MAX_RETRIES = 3
_BASE_BACKOFF = 15  # seconds; doubles each retry


def get_ai_client():
    """Return a singleton Google GenAI client."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY must be set in .env")
        _client = genai.Client(api_key=api_key)
    return _client


def generate_text(
    prompt: str,
    system_instruction: str = None,
    max_output_tokens: int = None,
) -> str:
    """
    Call the Gemini model with the given prompt.
    Automatically retries on 429 rate-limit errors with exponential backoff.
    Returns the stripped text response.

    max_output_tokens: if set, caps the response length at the API level.
    """
    client = get_ai_client()

    config_kwargs = {}
    if system_instruction:
        config_kwargs["system_instruction"] = system_instruction
    if max_output_tokens:
        config_kwargs["max_output_tokens"] = max_output_tokens

    if config_kwargs:
        from google.genai import types
        config = types.GenerateContentConfig(**config_kwargs)
    else:
        config = None

    last_exc = None
    for attempt in range(_MAX_RETRIES):
        try:
            if config:
                response = client.models.generate_content(
                    model=MODEL,
                    contents=prompt,
                    config=config,
                )
            else:
                response = client.models.generate_content(
                    model=MODEL,
                    contents=prompt,
                )
            return response.text.strip()

        except genai_errors.ClientError as e:
            last_exc = e
            # 429 = rate limited; wait and retry
            if e.status_code == 429 and attempt < _MAX_RETRIES - 1:
                wait = _BASE_BACKOFF * (2 ** attempt)
                time.sleep(wait)
                continue
            raise

    raise last_exc  # type: ignore[misc]


def parse_json_response(text: str):
    """
    Strip markdown fences that Gemini sometimes wraps around JSON,
    then parse and return the Python object.
    """
    text = text.strip()
    # Remove opening fence (```json or ```)
    if text.startswith("```"):
        # Drop first line (the fence opener)
        text = text.split("\n", 1)[-1]
        # Drop trailing fence
        if "```" in text:
            text = text.rsplit("```", 1)[0]
    return json.loads(text.strip())
