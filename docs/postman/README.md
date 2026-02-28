# Postman API Test Suite

Complete API test collection for the Jewellery E-Commerce admin panel.

## Files

| File | What to import as |
|------|-------------------|
| `Jewellery_Ecommerce_API.postman_collection.json` | **Collection** |
| `Jewellery_Ecommerce_Globals.postman_globals.json` | **Globals** |

## Setup

1. **Import both files** into Postman (File → Import → drag both files)
2. **Set your credentials** in Globals (gear icon → Globals):
   - `base_url` → `http://localhost:3000` (already set)
   - `admin_email` → your admin email (default: `admin@jewellery.com`)
   - `admin_password` → your admin password (change `CHANGE_ME`)
3. **Start your dev server** → `npm run dev`

## Execution Order

Run the folders **sequentially, top to bottom**. Each step auto-saves IDs into global variables for the next step.

```
Step 1 — AUTH
  1.1  Login (Admin)             → saves admin-token cookie + admin_user_id
  1.2  Login — Invalid Creds     → expects 401
  1.3  Login — Validation Error  → expects 400
  1.4  Get Current User (Me)     → verifies cookie auth works

Step 2 — CATEGORIES
  2.1  Create Parent Category    → saves category_id
  2.2  Create Child Category     → saves child_category_id (uses category_id as parent)
  2.3  Create — Validation Error → expects 400
  2.4  List Categories           → paginated list
  2.5  List — Search             → search by name "Ring"
  2.6  List — Filter by Parent   → filter by parent_id
  2.7  Get Category by ID        → single fetch
  2.8  Get — Not Found           → expects 404
  2.9  Update Category           → rename + sort order
  2.10 Update — Deactivate       → set is_active=false
  2.11 List — Active Only        → filter active_only=true
  2.12 Re-activate Child         → set is_active=true
  2.13 Delete Child Category     → cleanup child
  2.14 Delete — Not Found        → expects 404

Step 3 — PRODUCTS
  3.1  Create Product            → saves product_id (uses category_id)
  3.2  Create — Minimal Fields   → saves product_id_2 (only name + price)
  3.3  Create — Validation Error → expects 400
  3.4  List Products             → paginated list
  3.5  List — Search             → search by name "Diamond"
  3.6  List — Filter by Category → filter by category_id
  3.7  Get Product by ID         → single fetch with images
  3.8  Update Product            → update price, stock, description
  3.9  Update — Deactivate       → set is_active=false
  3.10 Delete Product (secondary)→ delete product_id_2
  3.11 Delete — Not Found        → expects 404

Step 4 — USERS
  4.1  Create User               → saves user_id
  4.2  Create — Duplicate Email  → expects 400/409
  4.3  Create — Validation Error → expects 400
  4.4  List Users                → paginated list, no password_hash
  4.5  List — Search             → search by "testuser"
  4.6  Get User by ID            → single fetch
  4.7  Update User               → update name + phone
  4.8  Update — Deactivate       → set is_active=false
  4.9  Delete — Self-delete      → expects 400 (blocked)
  4.10 Delete User               → delete test user

Step 5 — ROLES
  5.1  List Roles                → all roles with permissions
  5.2  Create Custom Role        → saves role_id
  5.3  Get Role by ID            → single fetch
  5.4  Update — Add Permissions  → add delete permissions
  5.5  Update — Locked super_admin → expects 403
  5.6  Delete Custom Role        → cleanup
  5.7  Delete — System Role      → expects 400

Step 6 — CLEANUP & LOGOUT
  6.1  Delete Test Product       → cleanup product_id
  6.2  Delete Test Category      → cleanup category_id
  6.3  Logout                    → clears cookie
  6.4  Verify Logged Out         → expects 401
```

## Auto-populated Variables

These are set automatically by test scripts during execution:

| Variable | Set by | Used by |
|----------|--------|---------|
| `admin_user_id` | 1.1 Login | 4.9 Self-delete test |
| `category_id` | 2.1 Create Parent | 2.6, 2.7, 2.9, 3.1, 3.6, 6.2 |
| `category_slug` | 2.1 Create Parent | — (available if needed) |
| `child_category_id` | 2.2 Create Child | 2.10, 2.12, 2.13 |
| `product_id` | 3.1 Create Product | 3.7, 3.8, 3.9, 6.1 |
| `product_id_2` | 3.2 Create Minimal | 3.10 |
| `user_id` | 4.1 Create User | 4.6, 4.7, 4.8, 4.10 |
| `role_id` | 5.2 Create Role | 5.3, 5.4, 5.6 |
| `super_admin_role_id` | 5.5 pre-request | 5.5, 5.7 |

## Running the Full Suite

**Collection Runner** (recommended for running all at once):
1. Click the collection → "Run" button
2. Set delay to `200ms` between requests
3. Keep the order as-is (folders run top to bottom)
4. Click "Run Jewellery E-Commerce API"

All 48 requests run in order, each test auto-validates response status and body.

## Test Coverage

| Area | Scenarios |
|------|-----------|
| Auth | Login success, invalid creds, validation error, me endpoint, logout, post-logout 401 |
| Categories | Create parent, create child (hierarchy), validation, list, search, filter by parent, filter active, get by ID, 404, update, deactivate/reactivate, delete, delete 404 |
| Products | Create full, create minimal, validation, list, search, filter by category, get by ID, update, deactivate, delete, delete 404 |
| Users | Create, duplicate email, validation, list, search, get by ID, update, deactivate, self-delete prevention, delete |
| Roles | List, create custom, get by ID, update permissions, locked super_admin (403), delete custom, delete system role (400) |
