import os
import uuid
from pathlib import Path
from fasthtml.common import *
from starlette.requests import Request
from starlette.responses import JSONResponse
from frontend.pages.tenant import tenant_page
from frontend.pages.staff import staff_page
from frontend.pages.admin import admin_page
from backend.services.supabase import (
    get_menu_items, create_order, get_order,
    get_active_orders, advance_order_status,
    get_all_menu_items, toggle_item_availability,
    create_menu_item, update_menu_item, delete_menu_item,
    get_settings, update_settings, get_todays_orders,
    verify_admin_password, verify_admin_token,
)

app, rt = fast_app()

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)


# --- Auth helper ---

def check_admin(request: Request):
    """Return True if valid admin token in Authorization header."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return False
    token = auth[7:]
    return verify_admin_token(token)


# --- Menu ---

@rt("/api/menu")
def menu_api():
    return JSONResponse(get_menu_items())


# --- Settings (public — tenant needs to check accepting status) ---

@rt("/api/settings")
def settings_api():
    return JSONResponse(get_settings())


# --- Orders ---

@rt("/api/orders", methods=["POST"])
async def create_order_api(request: Request):
    # Guard: reject orders when restaurant is paused
    settings = get_settings()
    if not settings or not settings.get("accepting_orders"):
        return JSONResponse(
            {"error": "The restaurant is not accepting orders right now"},
            status_code=503,
        )

    body = await request.json()

    unit_number = (body.get("unit_number") or "").strip()
    if not unit_number:
        return JSONResponse({"error": "Unit number is required"}, status_code=400)

    items = body.get("items")
    if not items:
        return JSONResponse({"error": "Cart is empty"}, status_code=400)

    total = body.get("total", 0)
    phone_number = body.get("phone_number")
    delivery_notes = body.get("delivery_notes")

    order = create_order(
        unit_number=unit_number,
        items=items,
        total=total,
        phone_number=phone_number,
        delivery_notes=delivery_notes,
    )
    return JSONResponse(order, status_code=201)


@rt("/api/orders/{order_id:int}")
def get_order_api(order_id: int):
    order = get_order(order_id)
    if not order:
        return JSONResponse({"error": "Order not found"}, status_code=404)
    return JSONResponse(order)


@rt("/api/orders", methods=["GET"])
def list_orders_api():
    return JSONResponse(get_active_orders())


@rt("/api/orders/{order_id:int}/advance", methods=["POST"])
def advance_order_api(order_id: int):
    order = advance_order_status(order_id)
    if not order:
        return JSONResponse({"error": "Order not found"}, status_code=404)
    return JSONResponse(order)


# --- Admin auth ---

@rt("/api/admin/auth", methods=["POST"])
async def admin_auth_api(request: Request):
    body = await request.json()
    password = body.get("password", "")
    token = verify_admin_password(password)
    if not token:
        return JSONResponse({"error": "Invalid password"}, status_code=401)
    return JSONResponse({"token": token})


# --- Admin settings ---

@rt("/api/admin/settings", methods=["POST"])
async def admin_settings_api(request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    body = await request.json()
    updated = update_settings(body)
    return JSONResponse(updated)


# --- Admin image upload ---

UPLOAD_DIR = Path("static/images/menu")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

@rt("/api/admin/upload", methods=["POST"])
async def admin_upload_api(request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    form = await request.form()
    file = form.get("file")
    if not file or not file.filename:
        return JSONResponse({"error": "No file provided"}, status_code=400)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return JSONResponse({"error": "Only JPG, PNG, WebP, GIF allowed"}, status_code=400)

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        return JSONResponse({"error": "File too large (max 5 MB)"}, status_code=400)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    filepath.write_bytes(contents)

    url = f"/static/images/menu/{filename}"
    return JSONResponse({"url": url})


# --- Admin menu ---

@rt("/api/admin/menu")
def admin_menu_api(request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    return JSONResponse(get_all_menu_items())


@rt("/api/admin/menu", methods=["POST"])
async def admin_create_menu_api(request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    body = await request.json()
    name = (body.get("name") or "").strip()
    if not name:
        return JSONResponse({"error": "Name is required"}, status_code=400)
    price = body.get("price")
    if price is None or float(price) < 0:
        return JSONResponse({"error": "Valid price is required"}, status_code=400)
    item = create_menu_item(body)
    if not item:
        return JSONResponse({"error": "Failed to create item"}, status_code=500)
    return JSONResponse(item, status_code=201)


@rt("/api/admin/menu/{item_id:int}", methods=["PUT"])
async def admin_update_menu_api(item_id: int, request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    body = await request.json()
    item = update_menu_item(item_id, body)
    if not item:
        return JSONResponse({"error": "Item not found"}, status_code=404)
    return JSONResponse(item)


@rt("/api/admin/menu/{item_id:int}", methods=["DELETE"])
def admin_delete_menu_api(item_id: int, request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    deleted = delete_menu_item(item_id)
    if not deleted:
        return JSONResponse({"error": "Item not found"}, status_code=404)
    return JSONResponse({"ok": True})


@rt("/api/admin/menu/{item_id:int}/toggle", methods=["POST"])
async def admin_toggle_menu_api(item_id: int, request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    body = await request.json()
    is_available = body.get("is_available", True)
    item = toggle_item_availability(item_id, is_available)
    if not item:
        return JSONResponse({"error": "Item not found"}, status_code=404)
    return JSONResponse(item)


# --- Admin orders ---

@rt("/api/admin/orders/today")
def admin_orders_today_api(request: Request):
    if not check_admin(request):
        return JSONResponse({"error": "Unauthorized"}, status_code=401)
    return JSONResponse(get_todays_orders())


# --- Pages ---

@rt("/")
def tenant():
    return tenant_page()

@rt("/staff")
def staff():
    return staff_page()

@rt("/admin")
def admin():
    return admin_page()


serve()
