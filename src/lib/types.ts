export interface Agent {
  id: string;
  email: string;
  name: string;
  pin_hash: string;
  is_active: boolean;
  created_at: string;
}

export interface Factory {
  id: string;
  slug: string;
  name: string;
  city: string;
  agent_id: string;
  system_prompt: string | null;
  is_active: boolean;
  visit_status: "draft" | "active" | "completed";
  created_at: string;
  updated_at: string;
}

export interface FactoryProfile {
  id: string;
  factory_id: string;
  section: string;
  data: Record<string, string>;
  updated_at: string;
}

export interface Owner {
  id: string;
  factory_id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  factory_id: string;
  phone: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  factory_id: string;
  lead_id: string;
  started_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
