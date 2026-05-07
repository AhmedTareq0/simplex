# API Reference — Customer Care App

## Base URL
```
https://api-simplex.envsabqpro.site
```

## Authentication
Every request (except login and refresh) requires a JWT Bearer token in the `Authorization` header.

```
Authorization: Bearer <JWT>
```

The account must be an **employee** in the **Customer Care** department.

---

## Response Envelope
All endpoints return the same wrapper:

```json
{
  "success": true,
  "message": null,
  "data": { ... }
}
```

**Error response:**
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## Table of Contents

1. [Auth](#auth)
2. [Tickets](#tickets)
3. [Conversations (AI Assistant)](#conversations-ai-assistant)

---

## Auth

### Employee Login
**`POST /api/auth/employee/login`**

**Request body:**
```json
{
  "email": "sara@company.com",
  "password": "secret123"
}
```

| Field | Type | Required |
|---|---|---|
| `email` | string | Yes |
| `password` | string | Yes |

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Signed in successfully.",
  "data": {
    "access_token": "eyJhbGci...",
    "refresh_token": "dGhpcyBpcyBh...",
    "token_type": "Bearer",
    "expires_at": "2026-05-06T11:00:00Z",
    "user": {
      "id": 5,
      "name": "Sara Hassan",
      "email": "sara@company.com",
      "avatar_url": "https://cdn.example.com/avatars/sara.jpg",
      "user_type": "employee",
      "employee_role": "customer_care",
      "department": "Customer Care",
      "partner": null,
      "employee": {
        "id": 5,
        "name": "Sara Hassan",
        "job_title": "Support Agent",
        "department": "Customer Care",
        "work_email": "sara@company.com",
        "work_phone": "+20100000001"
      }
    }
  }
}
```

**Error responses:**

| Code | Reason |
|---|---|
| `400` | Wrong credentials |
| `401` | Account is not an employee account |

---

### Refresh Token
**`POST /api/auth/refresh`**

Exchange a refresh token for a new access token.

**Request body:**
```json
{
  "refreshToken": "dGhpcyBpcyBh..."
}
```

**Response `200 OK`:** Same shape as Login response.

**Error responses:**

| Code | Reason |
|---|---|
| `400` | Refresh token is invalid or expired |

---

### Logout
**`POST /api/auth/logout`**

Invalidates the current access token.

**No request body.**

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```

---

### Get Current User
**`GET /api/auth/me`**

Returns the profile of the currently authenticated employee.

**Response `200 OK`:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": "usr_005",
    "partner_id": 0,
    "email": "sara@company.com",
    "name": "Sara Hassan",
    "user_type": "employee",
    "avatar_url": "https://cdn.example.com/avatars/sara.jpg",
    "phone": "+20100000001",
    "department": "Customer Care",
    "employee_role": "customer_care",
    "created_at": "2025-01-01T00:00:00Z",
    "last_login": "2026-05-06T09:00:00Z"
  }
}
```

---

## Tickets

### List My Tickets
**`GET /api/tickets/customer-care`**

Returns a paginated, filtered list of support tickets where you are the assigned Customer Care agent.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | `1` | Page number |
| `page_size` | int | `20` | Items per page |
| `status` | string | — | Filter: `open` / `in_progress` / `resolved` / `closed` / `solved` |
| `priority` | string | — | Filter: `low` / `medium` / `high` |
| `from` | datetime | — | Filter by created date (ISO 8601) |
| `to` | datetime | — | Filter by created date (ISO 8601) |

**Example:**
```
GET /api/tickets/customer-care?status=open&priority=high&page=1
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "id": 15,
        "odoo_id": 1042,
        "title": "Support — Printer X200 (Ahmed Mohamed)",
        "description": "Machine is overheating.",
        "status": "open",
        "priority": "high",
        "visit_date": null,
        "machine_id": "Printer X200",
        "conversation_id": "66487929b9c34e6f8041390ed7436535",
        "engineer_name": null,
        "customer_care_name": "Sara Hassan",
        "created_at": "2026-05-06T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

**Ticket `status` values:**

| Value | Meaning |
|---|---|
| `open` | Ticket created, work not started |
| `in_progress` | Engineer is working on it |
| `resolved` | Issue resolved |
| `closed` | Ticket fully closed |
| `solved` | Automatically closed when conversation was ended |

---

### Get Ticket Detail
**`GET /api/tickets/{id}`**

Returns full details of a single support ticket.

**Path parameter:**

| Parameter | Type | Description |
|---|---|---|
| `id` | int | The ticket's local ID |

**Response `200 OK`:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "id": 15,
    "odoo_id": 1042,
    "title": "Support — Printer X200 (Ahmed Mohamed)",
    "description": "Machine is overheating.",
    "status": "in_progress",
    "priority": "high",
    "visit_date": "2026-05-10T09:00:00Z",
    "machine_id": "Printer X200",
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "engineer_name": "Khaled Samir",
    "customer_care_name": "Sara Hassan",
    "created_at": "2026-05-06T10:00:00Z"
  }
}
```

**Error responses:**

| Code | Reason |
|---|---|
| `404` | Ticket not found |

---

### Update Ticket
**`PUT /api/tickets/{id}`**

Updates a ticket's status, priority, and/or scheduled visit date. Customer Care only.

**Path parameter:**

| Parameter | Type | Description |
|---|---|---|
| `id` | int | The ticket's local ID |

**Request body:**
```json
{
  "status": "in_progress",
  "priority": "high",
  "visit_date": "2026-05-10T09:00:00Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | No | `open` / `in_progress` / `resolved` / `closed` |
| `priority` | string | No | `low` / `medium` / `high` |
| `visit_date` | datetime | No | Scheduled engineer visit date (ISO 8601) |

**Response `200 OK`:** Same shape as Get Ticket Detail response.

**Error responses:**

| Code | Reason |
|---|---|
| `403` | Not a Customer Care employee |
| `404` | Ticket not found |

---

### Delete Ticket
**`DELETE /api/tickets/{id}`**

Deletes the ticket locally and removes it from Odoo. Customer Care only.

**Path parameter:**

| Parameter | Type | Description |
|---|---|---|
| `id` | int | The ticket's local ID |

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Ticket deleted.",
  "data": null
}
```

**Error responses:**

| Code | Reason |
|---|---|
| `403` | Not a Customer Care employee |
| `404` | Ticket not found |

---

## Conversations (AI Assistant)

### Conversation Status Values

| Status | Meaning |
|---|---|
| `ai` | Customer is chatting with AI — CC not yet involved |
| `pending_customer_care` | Customer escalated — waiting for CC to be assigned |
| `with_customer_care` | CC agent has joined |
| `pending_engineer` | Engineer assigned — waiting to join |
| `with_engineer` | Engineer has joined (3-way: customer + CC + engineer) |
| `ended` | Conversation closed by the customer |

---

### Send Message
**`POST /api/ai-assistant/customer-care/message`**

Content-Type: `multipart/form-data`

Valid when status is `with_customer_care`, `pending_engineer`, or `with_engineer`. Only the assigned CC agent can send messages.

**Request fields:**

| Field | Type | Required | Description |
|---|---|---|---|
| `ConversationId` | string | Yes | The conversation ID |
| `Message` | string | Yes | The message text |
| `Attachment` | file | No | Optional image, audio, video, or document |

**Response `200 OK`:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "reply": "I will check that for you right away.",
    "replied_by": "customer_care",
    "attachment_url": null,
    "timestamp": "2026-05-06T10:05:00Z"
  }
}
```

**Error responses:**

| Code | Reason |
|---|---|
| `400` | Conversation is not in an active CC status |
| `401` | You are not the assigned Customer Care for this conversation |
| `404` | Conversation not found |

---

### Request Engineer Visit
**`POST /api/ai-assistant/customer-care/request-engineer-visit`**

Auto-assigns the least-busy engineer to the conversation and creates a support ticket. Only valid while status is `with_customer_care`.

**Request body:**
```json
{
  "conversation_id": "66487929b9c34e6f8041390ed7436535"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Engineer assigned and ticket updated.",
  "data": {
    "id": 15,
    "odoo_id": 1042,
    "title": "Support — Printer X200 (Ahmed Mohamed)",
    "description": "Engineer visit requested via Customer Care. Machine: Printer X200. Customer: Ahmed Mohamed.",
    "status": "open",
    "priority": "medium",
    "visit_date": null,
    "machine_id": "Printer X200",
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "engineer_name": "Khaled Samir",
    "customer_care_name": "Sara Hassan",
    "created_at": "2026-05-06T10:10:00Z"
  }
}
```

Listen for WebSocket: `AgentJoined { role: "engineer" }` + `StatusChanged { status: "with_engineer" }`.

**Error responses:**

| Code | Reason |
|---|---|
| `400` | Status is not `with_customer_care` |
| `400` | No engineers are currently available |
| `401` | You are not the assigned Customer Care |
| `404` | Conversation not found |

---

### Get Message History
**`GET /api/ai-assistant/messages/{conversationId}`**

Returns the full message history. Accessible only if you are the assigned CC agent.

**Response `200 OK`:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "status": "with_engineer",
    "messages": [
      {
        "id": "a1b2c3d4e5f600000000000000000001",
        "role": "customer",
        "content": "My machine is overheating.",
        "attachment_url": null,
        "attachment_type": null,
        "timestamp": "2026-05-06T10:00:30Z"
      },
      {
        "id": "a1b2c3d4e5f600000000000000000002",
        "role": "ai",
        "content": "Please make sure the ventilation is clear.",
        "attachment_url": null,
        "attachment_type": null,
        "timestamp": "2026-05-06T10:00:31Z"
      },
      {
        "id": "a1b2c3d4e5f600000000000000000003",
        "role": "system",
        "content": "Sara Hassan (Customer Care) has joined the conversation.",
        "attachment_url": null,
        "attachment_type": null,
        "timestamp": "2026-05-06T10:03:00Z"
      },
      {
        "id": "a1b2c3d4e5f600000000000000000004",
        "role": "customer_care",
        "content": "I see the issue — let me assign an engineer.",
        "attachment_url": null,
        "attachment_type": null,
        "timestamp": "2026-05-06T10:04:00Z"
      },
      {
        "id": "a1b2c3d4e5f600000000000000000005",
        "role": "system",
        "content": "Engineer Khaled Samir has been assigned and joined the conversation.",
        "attachment_url": null,
        "attachment_type": null,
        "timestamp": "2026-05-06T10:10:00Z"
      },
      {
        "id": "a1b2c3d4e5f600000000000000000006",
        "role": "engineer",
        "content": "Hello, I am on my way.",
        "attachment_url": null,
        "attachment_type": null,
        "timestamp": "2026-05-06T10:11:00Z"
      }
    ]
  }
}
```

**`role` values:** `customer` / `ai` / `customer_care` / `engineer` / `system`

> When a conversation is reopened, a `system` message appears: `"Conversation reopened by customer."` — use it as a visual divider between rounds.

**Error responses:**

| Code | Reason |
|---|---|
| `401` | You are not a participant in this conversation |
| `404` | Conversation not found |

---

### Get Conversation List
**`GET /api/ai-assistant/conversations`**

Returns a paginated list of conversations where you are the assigned Customer Care agent.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | int | `1` | Page number |
| `page_size` | int | `10` | Items per page |
| `machine_id` | int | — | Filter by machine |
| `from` | datetime | — | Filter by created date |
| `to` | datetime | — | Filter by created date |

**Response `200 OK`:**
```json
{
  "success": true,
  "message": null,
  "data": {
    "items": [
      {
        "conversation_id": "66487929b9c34e6f8041390ed7436535",
        "status": "with_engineer",
        "machine": {
          "id": 42,
          "name": "Printer X200",
          "type": "Printer",
          "image": "https://cdn.example.com/machines/42.jpg"
        },
        "customer_name": "Ahmed Mohamed",
        "customer_profile_image": "https://cdn.example.com/avatars/ahmed.jpg",
        "customer_care_name": "Sara Hassan",
        "engineer_name": "Khaled Samir",
        "escalation_reason": "Machine is overheating.",
        "last_message": "I am on my way.",
        "last_message_at": "2026-05-06T10:11:00Z",
        "created_at": "2026-05-06T10:00:00Z",
        "ended_at": null
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10,
    "total_pages": 1
  }
}
```

**Conversation list fields:**

| Field | Description |
|---|---|
| `customer_profile_image` | Customer avatar URL or `null` |
| `engineer_name` | Assigned engineer or `null` if not yet requested |
| `escalation_reason` | Why the customer escalated |
| `ended_at` | When conversation ended, or `null` if still active |

---

## WebSocket Events

Connect to receive real-time events:
```
ws://135.181.24.133/ws/chat?access_token=<JWT>
```

**Events relevant to Customer Care:**

| Event | When | Action |
|---|---|---|
| `NewEscalation` | A new conversation has been assigned to you | Show notification, add to list |
| `MessageReceived` | Customer or engineer sends a message | Append to chat |
| `StatusChanged` | Conversation status changes | Update status badge |
| `AgentJoined` | Engineer joined after your request | Update UI |
| `ConversationEnded` | Customer ended the conversation | Mark as ended in list |
| `ConversationReopened` | Customer reopened — your assignment is cleared | Remove from active list |
| `UnreadCount` | Unread message counter updated | Show badge |
| `TypingIndicator` | Customer is typing | Show typing indicator |

> **On `ConversationReopened`:** your assignment is cleared immediately. The conversation will only reappear in your list if the customer escalates again and you are re-assigned.

---

## Typical Flow

```
Login  →  POST /api/auth/employee/login
Register push token  →  POST /api/notifications/register
  → Subscribed to cc_agents FCM topic automatically

Customer escalates
  → Push notification received (FCM)
  → WS: NewEscalation { conversation_id, customer_name, machine_id, escalation_reason }
  → WS: StatusChanged { status: "with_customer_care" }

Load history  →  GET /api/ai-assistant/messages/{conversationId}
Chat with customer  →  POST /api/ai-assistant/customer-care/message

Request engineer  →  POST /api/ai-assistant/customer-care/request-engineer-visit
  → WS: AgentJoined { role: "engineer" }
  → WS: StatusChanged { status: "with_engineer" }

3-way chat continues...

Customer ends conversation
  → WS: ConversationEnded
  → Ticket automatically marked as solved

Customer reopens later
  → WS: ConversationReopened  (your assignment cleared)
  → Conversation removed from your active list
  → If customer escalates again, you may be re-assigned

Check your tickets  →  GET /api/tickets/customer-care
Update ticket  →  PUT /api/tickets/{id}
```
