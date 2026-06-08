# Machines & Visit Request API

---

## 1. List All Machines

**Endpoint:** `GET /api/machines/all`  
**Auth:** Employee only (Customer Care, Engineer, SuperAdmin)

### Query Parameters

| Parameter   | Type    | Required | Description |
|-------------|---------|----------|-------------|
| `search`    | string  | No       | Search by name or default code (contains, case-insensitive) |
| `category`  | string  | No       | Filter by category name (contains) |
| `type`      | string  | No       | Filter by exact type value |
| `available` | boolean | No       | `true` → only machines with `free_to_use > 0` |
| `page`      | int     | No       | Page number, default `1` |
| `pageSize`  | int     | No       | Items per page, default `20` |

### Example Request

```
GET /api/machines/all?search=router&available=true&page=1&pageSize=10
```

### Response `200 OK`

```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "id": 3,
        "name": "راوتر ماشين",
        "display_name": "راوتر ماشين",
        "default_code": "RTR-001",
        "description": "...",
        "description_sale": "...",
        "list_price": 1500.00,
        "category": "Routers",
        "type": "product",
        "active": true,
        "free_to_use": 2.0,
        "qty_available": 5.0,
        "create_date": "2025-01-01T00:00:00Z",
        "write_date": "2026-05-01T00:00:00Z",
        "synced_at": "2026-06-01T10:00:00Z",
        "image_url": "https://odoo.example.com/web/image/6?v=638765432100000000",
        "document_url": null
      }
    ],
    "total": 42,
    "page": 1,
    "page_size": 10,
    "total_pages": 5
  }
}
```

### Key Fields

| Field          | Description |
|----------------|-------------|
| `id`           | Local DB ID — use this in `product_ids` when requesting a visit |
| `free_to_use`  | Number of units available for free use. `> 0` means eligible for a sale order |
| `qty_available`| Total stock quantity in Odoo |
| `image_url`    | Versioned URL (`?v=...`) — changes when Odoo write date changes, forcing cache refresh |

> **Note:** Run `POST /api/machines/sync` (SuperAdmin) to pull the latest data from Odoo before using this endpoint. Products with `free_to_use = 0` will not generate a sale order when added to a visit request.

---

## 2. Request Engineer Visit — From Chat

**Endpoint:** `POST /api/ai-assistant/customer-care/request-engineer-visit`  
**Auth:** Employee only (Customer Care role)

Used when the conversation is in `with_customer_care` status. Automatically picks the least-busy engineer, creates a visit in DB and Odoo, moves the ticket to `in_progress`, and creates a confirmed sale order in Odoo for any products with `free_to_use > 0`.

### Request Body

```json
{
  "conversation_id": "9a0e23f3938f42fca9532fa7cba9cdad",
  "visit_type": "maintenance",
  "priority": "high",
  "maintenance_type": "Replacement",
  "description": "Machine stopped working after power cut",
  "product_ids": [3, 6]
}
```

| Field              | Type         | Required | Values |
|--------------------|--------------|----------|--------|
| `conversation_id`  | string       | Yes      | Active conversation ID |
| `visit_type`       | string       | Yes      | `maintenance` \| `installation` |
| `priority`         | string       | Yes      | `low` \| `medium` \| `high` |
| `maintenance_type` | string       | Yes      | `Scrap` \| `Replacement` \| `Gifts` \| `Custody` \| `Deficits` |
| `description`      | string       | Yes      | Description of the issue |
| `product_ids`      | int[]        | No       | Local DB machine IDs (from `GET /api/machines/all`). Must all have `free_to_use > 0` or request is rejected. |

### Response `200 OK`

```json
{
  "success": true,
  "message": "Engineer assigned and ticket updated.",
  "data": {
    "id": 1043,
    "title": "راوتر ماشين",
    "status": "In Progress",
    "priority": "High",
    "machine_id": 4,
    "machine_name": "راوتر ماشين",
    "conversation_id": "9a0e23f3938f42fca9532fa7cba9cdad",
    "customer_name": null,
    "engineer_name": "Alaa nabil",
    "customer_care_name": "Mohamed Ahmed",
    "visit_id": 15,
    "created_at": "2026-06-03T23:18:41.813694",
    "ticket_rating": null,
    "ticket_rating_feedback": null
  }
}
```

### Error Cases

| Status | Reason |
|--------|--------|
| `400`  | `Product "X" is not available in inventory.` — a requested product has `free_to_use = 0` |
| `400`  | Conversation is not in `with_customer_care` status |
| `401`  | Caller is not the assigned Customer Care for this conversation |
| `404`  | Conversation not found |

### Side Effects

- Engineer auto-assigned (least active ticket count)
- Odoo helpdesk ticket stage moved to **In Progress**
- Odoo helpdesk ticket priority updated
- Odoo FSM task (visit) created with priority
- Confirmed sale order created in Odoo for each product with `free_to_use > 0`, linked to the FSM task
- WebSocket + push notifications sent to customer and engineer

---

## 3. Request Engineer Visit — From Ticket

**Endpoint:** `POST /api/tickets/{id}/request-visit`  
**Auth:** Employee only (Customer Care role)

Used when managing a ticket directly (not via chat). Behaviour and side effects are identical to the chat path.

### URL Parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `id`      | int  | Ticket DB ID |

### Request Body

Same as the chat endpoint (minus `conversation_id`):

```json
{
  "visit_type": "maintenance",
  "priority": "high",
  "maintenance_type": "Replacement",
  "description": "Machine stopped working after power cut",
  "product_ids": [3]
}
```

### Response `200 OK`

Same `SupportTicketDto` structure as above.

### Error Cases

| Status | Reason |
|--------|--------|
| `400`  | Ticket is already `solved`, `closed`, or `cancelled` |
| `400`  | A visit has already been requested for this ticket |
| `400`  | `Product "X" is not available in inventory.` — a requested product has `free_to_use = 0` |
| `404`  | Ticket not found |

---

## 4. Visit Products Field

Visits returned by `GET /api/visits`, `GET /api/visits/engineer`, `GET /api/visits/all`, and `GET /api/visits/detail` now include a `products` array with full product details for every product requested in the visit. No separate lookup is needed.

### `products` array — fields

| Field         | Type   | Description |
|---------------|--------|-------------|
| `name`        | string | Product name |
| `image_url`   | string \| null | Product image URL |
| `description` | string | Product description |

### Example (inside any visit object)

```json
{
  "id": 15,
  "name": "Visit #15 - Machine Maintenance",
  "status": "new",
  "products": [
    {
      "name": "Laser Head Assembly",
      "image_url": "https://example.com/storage/products/laser-head.jpg",
      "description": "Replacement laser head for X200 series"
    },
    {
      "name": "Cooling Fan",
      "image_url": null,
      "description": ""
    }
  ]
}
```

> If no products were requested, `products` is an empty array `[]`.

---

## Priority Mapping (Odoo)

| API value  | Odoo helpdesk ticket | Odoo FSM task |
|------------|----------------------|---------------|
| `"low"`    | `"0"` — 1 star       | `"0"` — Normal |
| `"medium"` | `"1"` — 2 stars      | `"1"` — Urgent |
| `"high"`   | `"2"` — 3 stars      | `"2"` — 3 stars |

---

## Sale Order Flow (on Visit Request)

1. `product_ids` are validated **before any state change** — if any product has `free_to_use = 0`, the entire request is rejected with `400` and the conversation/ticket remains unchanged.
2. After the Odoo FSM task is created, products with `free_to_use > 0` are resolved to their `product.product` variants.
3. One `sale.order` is created in Odoo with one line per product (qty = 1).
4. The order is immediately confirmed (`action_confirm`).
5. The confirmed order is linked to the FSM task via `sale_order_id`.
6. The created visit includes a `products` array with `name`, `image_url`, and `description` for each requested product — visible on all visit list and detail endpoints.
