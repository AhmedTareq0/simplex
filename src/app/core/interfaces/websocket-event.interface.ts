export interface NewEscalationPayload {
  conversation_id: string;
  customer_name: string;
  machine_id: string;
  escalation_reason: string;
  escalated_at: string;
}

export interface MessageReceivedPayload {
  conversation_id: string;
  id: string;
  role: string;
  content: string;
  timestamp: string;
  attachment_url: string | null;
  attachment_type: string | null;
}

export interface StatusChangedPayload {
  conversation_id: string;
  status: string;
}

export interface AgentJoinedPayload {
  conversation_id: string;
  name: string;
  role: string;
}

export interface TypingIndicatorPayload {
  conversation_id: string;
  sender_name: string;
  sender_role: string;
}

export interface UnreadCountPayload {
  conversation_id: string;
  count: number;
}

export interface EngineerAssignedPayload {
  conversation_id: string;
  customer_name: string;
  machine_id: string;
  customer_care_name: string;
}

export interface ConversationEndedPayload {
  conversation_id: string;
}
