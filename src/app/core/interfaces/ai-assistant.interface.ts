export interface AiConversation {
  id: string; // conversation_id
  machine_id: number;
  machine_name?: string;
  machine_type?: string;
  machine_image?: string | null;
  title: string;
  created_at: string;
  expires_at: string; // created_at + 4 hours
  last_message?: string;
  last_message_at?: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  timestamp: string;
}

export interface StartConversationResponse {
  conversation_id: string;
  created_at?: string;
  machine?: {
    id: number;
    name: string;
    type?: string;
    image?: string | null;
  };
}

export interface SendAiChatResponse {
  conversation_id: string;
  reply: string;
  replied_by: string;
  attachment_url?: string | null;
  timestamp: string;
}

export interface AiMessagesResponse {
  conversation_id: string;
  messages: Array<{
    id?: string;
    role: string;
    content: string;
    attachment_url?: string | null;
    attachment_type?: string | null;
    timestamp: string;
  }>;
}
