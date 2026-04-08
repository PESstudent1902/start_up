from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY

_client = None

def get_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Supabase URL and KEY must be set in environment variables")
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client

def safe_query(func):
    """Decorator for safe Supabase queries with error handling"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs), None
        except Exception as e:
            return None, str(e)
    return wrapper
