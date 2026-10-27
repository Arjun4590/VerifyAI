from fastapi import Header, HTTPException, Depends
from typing import List, Optional
from .config import ROLE_SYSTEM_ADMIN, ROLE_SCRUTINY_OFFICER, ROLE_SENIOR_REVIEWER, ALL_ROLES

def get_current_user_and_role(
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    x_demo_user: Optional[str] = Header(None, alias="X-Demo-User"),
) -> dict:
    """
    Extracts demo user and role from request headers.
    Defaults to scrutiny_officer if not explicitly set.
    """
    role = x_demo_role or ROLE_SCRUTINY_OFFICER
    role = role.strip().lower()

    if role not in ALL_ROLES:
        # Gracefully map human names if needed
        if "admin" in role:
            role = ROLE_SYSTEM_ADMIN
        elif "senior" in role or "reviewer" in role:
            role = ROLE_SENIOR_REVIEWER
        else:
            role = ROLE_SCRUTINY_OFFICER

    user_map = {
        ROLE_SYSTEM_ADMIN: "Administrator (Admin)",
        ROLE_SCRUTINY_OFFICER: "Officer A (Scrutiny Officer)",
        ROLE_SENIOR_REVIEWER: "Senior Reviewer (Review Authority)"
    }
    user_name = x_demo_user or user_map.get(role, "Officer A")

    return {
        "username": user_name,
        "role": role,
    }

def require_role(allowed_roles: List[str]):
    """
    Enforces backend role-based access control.
    Returns 403 Forbidden if current role is not in allowed_roles.
    """
    def dependency(user_ctx: dict = Depends(get_current_user_and_role)):
        role = user_ctx["role"]
        if role not in allowed_roles:
            readable_allowed = ", ".join([r.replace("_", " ").title() for r in allowed_roles])
            readable_current = role.replace("_", " ").title()
            raise HTTPException(
                status_code=403,
                detail=f"Access Denied: Current role '{readable_current}' lacks required permissions. Requires: {readable_allowed}."
            )
        return user_ctx
    return dependency
