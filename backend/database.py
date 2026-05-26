import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None


def get_supabase() -> Client:
    """Return a singleton Supabase client using the service-role key."""
    global _client
    if _client is None:
        supabase_id = os.getenv("SUPABASE_ID")
        key = os.getenv("SUPABASE_API_KEY")
        if not supabase_id or not key:
            raise RuntimeError("SUPABASE_ID and SUPABASE_API_KEY must be set in .env")
        url = f"https://{supabase_id}.supabase.co"
        _client = create_client(url, key)
    return _client
