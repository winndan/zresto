import os
import secrets
import random
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Supabase env vars missing")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Valid status transitions (one direction only per CLAUDE.md)
STATUS_FLOW = ["new", "preparing", "ready", "delivered"]

# In-memory token store (server restart invalidates all sessions)
_admin_tokens: set[str] = set()


def get_menu_items():
    res = (
        supabase
        .table("menu_items")
        .select("id,name,description,price,category,image_url")
        .eq("is_available", True)
        .order("created_at")
        .execute()
    )
    return res.data


def create_order(unit_number: str, items: list, total: float,
                 phone_number: str = None, delivery_notes: str = None):
    order_number = random.randint(1000, 9999)
    row = {
        "order_number": order_number,
        "unit_number": unit_number.strip().upper(),
        "phone_number": phone_number or None,
        "delivery_notes": delivery_notes or None,
        "items": items,
        "total": total,
        "status": "new",
    }
    res = supabase.table("orders").insert(row).execute()
    return res.data[0]


def get_order(order_id: int):
    res = (
        supabase
        .table("orders")
        .select("*")
        .eq("id", order_id)
        .single()
        .execute()
    )
    return res.data


def get_active_orders():
    res = (
        supabase
        .table("orders")
        .select("*")
        .neq("status", "delivered")
        .order("created_at", desc=False)
        .execute()
    )
    return res.data


def advance_order_status(order_id: int):
    """Move order to the next status in the lifecycle."""
    order = get_order(order_id)
    if not order:
        return None

    current = order["status"]
    idx = STATUS_FLOW.index(current)
    if idx >= len(STATUS_FLOW) - 1:
        return order  # already delivered

    new_status = STATUS_FLOW[idx + 1]
    res = (
        supabase
        .table("orders")
        .update({"status": new_status})
        .eq("id", order_id)
        .execute()
    )
    return res.data[0]


# ========================================
# ADMIN: Menu management
# ========================================

def get_all_menu_items():
    """All items including unavailable (for admin view)."""
    res = (
        supabase
        .table("menu_items")
        .select("id,name,description,price,category,image_url,is_available")
        .order("created_at")
        .execute()
    )
    return res.data


def toggle_item_availability(item_id: int, is_available: bool):
    res = (
        supabase
        .table("menu_items")
        .update({"is_available": is_available})
        .eq("id", item_id)
        .execute()
    )
    return res.data[0] if res.data else None


def create_menu_item(data: dict):
    allowed = {"name", "description", "price", "category", "image_url", "is_available"}
    row = {k: v for k, v in data.items() if k in allowed}
    res = supabase.table("menu_items").insert(row).execute()
    return res.data[0] if res.data else None


def update_menu_item(item_id: int, data: dict):
    allowed = {"name", "description", "price", "category", "image_url", "is_available"}
    clean = {k: v for k, v in data.items() if k in allowed}
    if not clean:
        return None
    res = (
        supabase
        .table("menu_items")
        .update(clean)
        .eq("id", item_id)
        .execute()
    )
    return res.data[0] if res.data else None


def delete_menu_item(item_id: int):
    res = (
        supabase
        .table("menu_items")
        .delete()
        .eq("id", item_id)
        .execute()
    )
    return len(res.data) > 0


# ========================================
# ADMIN: Restaurant settings
# ========================================

def get_settings():
    res = (
        supabase
        .table("restaurant_settings")
        .select("*")
        .eq("id", 1)
        .single()
        .execute()
    )
    return res.data


def update_settings(data: dict):
    allowed = {"accepting_orders", "prep_time_minutes"}
    clean = {k: v for k, v in data.items() if k in allowed}
    if not clean:
        return get_settings()
    res = (
        supabase
        .table("restaurant_settings")
        .update(clean)
        .eq("id", 1)
        .execute()
    )
    return res.data[0]


# ========================================
# ADMIN: Today's orders
# ========================================

def get_todays_orders():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    res = (
        supabase
        .table("orders")
        .select("*")
        .gte("created_at", f"{today}T00:00:00+00:00")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data


# ========================================
# ADMIN: Auth
# ========================================

def verify_admin_password(password: str):
    if not secrets.compare_digest(password, ADMIN_PASSWORD):
        return None
    token = secrets.token_hex(32)
    _admin_tokens.add(token)
    return token


def verify_admin_token(token: str):
    return token in _admin_tokens
