"""Request-scoped clients: never share Supabase Auth sessions between users."""
import os
from collections.abc import Iterator
import httpx
from dotenv import load_dotenv
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import Client, create_client
from supabase.lib.client_options import SyncClientOptions as ClientOptions

load_dotenv()
bearer = HTTPBearer(auto_error=False)


def get_supabase(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> Iterator[Client]:
    headers = {"Authorization": f"Bearer {credentials.credentials}"} if credentials else {}
    with httpx.Client(timeout=30) as transport:
        yield create_client(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"],
            options=ClientOptions(headers=headers, persist_session=False,
                                  auto_refresh_token=False, httpx_client=transport),
        )
