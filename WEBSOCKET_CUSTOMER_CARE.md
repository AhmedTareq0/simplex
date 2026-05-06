# WebSocket — Customer Care App

## Connection

```
ws://135.181.24.133//chat?access_token=<JWT>
```

Pass the JWT token obtained from `POST /api/auth/employee/login` as a query parameter.  
**No Authorization header** — query string only.

```
ws://135.181.24.133/ws/chat?access_token=eyJhbGci...
```

On connect the server automatically:
- Subscribes the connection to the **Customer Care queue** (`queue:customer_care`) — receives `NewEscalation` events for every new customer request.
- Subscribes the connection to **all active conversations** this agent is already part of.
- Sends an `UnreadCount` event for each conversation that has unread messages.

---

## Message Envelope

Every message in both directions is JSON.

**Server → Client**
```json
{
  "event": "<EventName>",
  "data": { ... }
}
```

**Client → Server**
```json
{
  "type": "<action>",
  ...fields
}
```

---

## Client → Server (Actions)

### join_conversation
Subscribe to a specific conversation room after accepting it via REST.  
Call this right after `POST /api/ai-assistant/customer-care/join`.

```json
{
  "type": "join_conversation",
  "conversation_id": "66487929b9c34e6f8041390ed7436535"
}
```

---

### leave_conversation
Unsubscribe from a conversation room.

```json
{
  "type": "leave_conversation",
  "conversation_id": "66487929b9c34e6f8041390ed7436535"
}
```

---

### typing
Broadcast a typing indicator to the customer (and engineer if present).

```json
{
  "type": "typing",
  "conversation_id": "66487929b9c34e6f8041390ed7436535",
  "sender_name": "Sara Hassan",
  "sender_role": "customer_care"
}
```

---

### mark_read
Clear the unread counter for a conversation.

```json
{
  "type": "mark_read",
  "conversation_id": "66487929b9c34e6f8041390ed7436535"
}
```

---

### ping
Keep-alive check. Server replies with `pong`.

```json
{ "type": "ping" }
```

---

## Server → Client (Events)

### NewEscalation
A customer escalated their conversation and is waiting for an agent.  
Pushed to **all connected customer care employees** automatically (no join needed).

```json
{
  "event": "NewEscalation",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "customer_name": "Ahmed Mohamed",
    "machine_id": "4",
    "escalation_reason": "الماكينة لا تعمل بشكل صحيح",
    "escalated_at": "2026-05-05T10:15:30Z"
  }
}
```

> After receiving this, call `GET /api/ai-assistant/customer-care/pending` to get the full queue, then `POST /api/ai-assistant/customer-care/join` to accept.

---

### MessageReceived
A new message arrived in a conversation the agent has joined.

```json
{
  "event": "MessageReceived",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "id": "a1b2c3d4e5f6...",
    "role": "customer",
    "content": "الماكينة بتعمل أصوات غريبة",
    "timestamp": "2026-05-05T10:23:45Z",
    "attachment_url": "http://135.181.24.133/attachments/conv_abc.jpg",
    "attachment_type": "image/jpeg"
  }
}
```

| `role` | Who sent it |
|---|---|
| `customer` | The customer |
| `customer_care` | This agent or another agent |
| `engineer` | The assigned engineer |
| `system` | Server-generated (join/leave notices) |
| `ai` | AI reply (only during the AI phase) |

---

### StatusChanged
The conversation moved to a new state.

```json
{
  "event": "StatusChanged",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "status": "with_customer_care"
  }
}
```

| `status` | Meaning |
|---|---|
| `ai` | Chatting with AI (before escalation) |
| `pending_customer_care` | Waiting for agent |
| `with_customer_care` | Agent joined |
| `pending_engineer` | Engineer assigned, not yet joined |
| `with_engineer` | Engineer has joined |
| `ended` | Conversation closed |

---

### AgentJoined
An agent or engineer joined the conversation.

```json
{
  "event": "AgentJoined",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "name": "Mohamed Ali",
    "role": "engineer"
  }
}
```

---

### EngineerAssigned
Sent to the assigned engineer's personal channel when this agent assigns them.  
The customer care app receives this if the agent is also monitoring that channel.

```json
{
  "event": "EngineerAssigned",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "customer_name": "Ahmed Mohamed",
    "machine_id": "4",
    "customer_care_name": "Sara Hassan"
  }
}
```

---

### ConversationEnded
The conversation was closed.

```json
{
  "event": "ConversationEnded",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535"
  }
}
```

---

### TypingIndicator
The customer or engineer is typing.

```json
{
  "event": "TypingIndicator",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "sender_name": "Ahmed Mohamed",
    "sender_role": "customer"
  }
}
```

---

### UnreadCount
Sent on connect and after `mark_read`.

```json
{
  "event": "UnreadCount",
  "data": {
    "conversation_id": "66487929b9c34e6f8041390ed7436535",
    "count": 5
  }
}
```

---

### pong
Response to a `ping`.

```json
{
  "event": "pong",
  "data": {}
}
```

---

## Typical Flow

```
Agent connects → WS open
  ↓
Server auto-joins agent to:
  - queue:customer_care   (new escalation alerts)
  - conv:abc123...        (any active conversation already joined)
Server sends UnreadCount for each active conversation

── New customer escalates ──────────────────────────────
Server pushes NewEscalation to ALL connected agents
  ↓
Agent calls REST: GET  /api/ai-assistant/customer-care/pending  (see the queue)
Agent calls REST: POST /api/ai-assistant/customer-care/join     (accept conversation)
Agent sends WS:   join_conversation { conversation_id }
  ↓
Server pushes StatusChanged  { status: "with_customer_care" }
Server pushes AgentJoined    { name: "Sara", role: "customer_care" }

── Chatting ────────────────────────────────────────────
Customer sends message (REST) → Server pushes MessageReceived { role: "customer" }
Agent sends message    (REST) → Server pushes MessageReceived { role: "customer_care" }
Agent sends typing     (WS)   → Server pushes TypingIndicator to conversation group

── Assign engineer ─────────────────────────────────────
Agent calls REST: GET  /api/ai-assistant/customer-care/engineers   (list engineers)
Agent calls REST: POST /api/ai-assistant/customer-care/assign-engineer
  ↓
Server pushes StatusChanged    { status: "pending_engineer" }
Server pushes EngineerAssigned to engineer's personal channel

── Engineer joins ──────────────────────────────────────
Server pushes AgentJoined    { role: "engineer" }
Server pushes StatusChanged  { status: "with_engineer" }

── End conversation ─────────────────────────────────────
Agent calls REST: POST /api/ai-assistant/customer-care/end
  ↓
Server pushes ConversationEnded to all participants
```

---

## REST Endpoints Referenced

| Action | Method | URL |
|---|---|---|
| Get pending queue | GET | `/api/ai-assistant/customer-care/pending` |
| Join conversation | POST | `/api/ai-assistant/customer-care/join` |
| Send message | POST | `/api/ai-assistant/customer-care/message` |
| List engineers | GET | `/api/ai-assistant/customer-care/engineers` |
| Assign engineer | POST | `/api/ai-assistant/customer-care/assign-engineer` |
| End conversation | POST | `/api/ai-assistant/customer-care/end` |
| Get history | GET | `/api/ai-assistant/conversation/{id}/messages` |
| List my conversations | GET | `/api/ai-assistant/conversations` |
