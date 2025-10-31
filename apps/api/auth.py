import os
from fastapi import Request, HTTPException

AUTH_DISABLED = os.environ.get("AUTH_DISABLED", "false").lower() == "true"

# Very light-weight JWT passthrough. In production, verify Supabase JWT here.
# Keeping simple for starter; you can integrate full verification with PyJWT and SUPABASE_JWT_SECRET.
async def require_user_sub(request: Request) -> str:
    if AUTH_DISABLED:
        return "dev-user-sub"
    sub = request.headers.get("x-user-sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Missing x-user-sub header (or disable auth in env)")
    return sub

# Alias for consistency (sync version for Depends)
def get_user_sub(request: Request) -> str:
    if AUTH_DISABLED:
        return "dev-user-sub"
    sub = request.headers.get("x-user-sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Missing x-user-sub header (or disable auth in env)")
    return sub
