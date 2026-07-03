// TODO: Add shared API types after backend contracts are defined.

export type ApiError = {
  message: string;
};

// ---- Workflow Automation Engine ----

export type TriggerType =
  | "lead_created"
  | "lead_status_changed"
  | "deal_stage_changed"
  | "ticket_created"
  | "ticket_escalated"
  | "customer_onboarded"
  | "manual";

export type ActionType =
  | "send_email"
  | "send_sms"
  | "create_task"
  | "assign_lead"
  | "escalate_ticket"
  | "request_approval"
  | "wait";

export type WorkflowStep = {
  id?: number;
  order: number;
  action_type: ActionType;
  action_config: Record<string, unknown>;
};

export type Workflow = {
  id: number;
  name: string;
  description: string;
  trigger_type: TriggerType;
  trigger_conditions: Record<string, unknown>;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
};

export type WorkflowRunStatus = "pending" | "running" | "waiting_approval" | "completed" | "failed";

export type WorkflowRunLogEntry = {
  step: number;
  action_type: string;
  status: "ok" | "skipped" | "error";
  message: string;
  at: string;
};

export type WorkflowRun = {
  id: number;
  workflow: number;
  workflow_name: string;
  trigger_payload: Record<string, unknown>;
  status: WorkflowRunStatus;
  current_step: number | null;
  log: WorkflowRunLogEntry[];
  error_message: string;
  started_at: string;
  finished_at: string | null;
};

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type ApprovalRequest = {
  id: number;
  workflow_run: number;
  workflow_name: string;
  step: number;
  approver: number | null;
  status: ApprovalStatus;
  comment: string;
  requested_at: string;
  decided_at: string | null;
};

// ---- Customer Support Module ----

export type TicketStatus = "new" | "open" | "pending" | "escalated" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory =
  | "billing"
  | "technical"
  | "account"
  | "feature_request"
  | "complaint"
  | "general";
export type Sentiment = "positive" | "neutral" | "negative" | "";

export type Ticket = {
  id: number;
  subject: string;
  description: string;
  customer_name: string;
  customer_email: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  sentiment: Sentiment;
  sentiment_score: number | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  sla_policy: number | null;
  response_due_at: string | null;
  resolution_due_at: string | null;
  first_responded_at: string | null;
  resolved_at: string | null;
  is_response_sla_breached: boolean;
  is_resolution_sla_breached: boolean;
  created_at: string;
  updated_at: string;
};

export type TicketComment = {
  id: number;
  ticket: number;
  author: number | null;
  author_name: string | null;
  body: string;
  is_internal: boolean;
  is_ai_suggested: boolean;
  created_at: string;
};

export type KnowledgeBaseArticle = {
  id: number;
  title: string;
  slug: string;
  body: string;
  category: string;
  keywords: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type AgentPerformance = {
  assigned_to__id: number;
  assigned_to__username: string;
  open_count: number;
  resolved_count: number;
  total_count: number;
};

export type SupportSummary = {
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  average_resolution_minutes: number | null;
  agent_performance: AgentPerformance[];
};

export type ChatbotReply = {
  answer: string;
  source_article_id: number | null;
  source_title: string | null;
  confidence: number;
};

// ---- Analytics & Dashboard ----

export type MetricEventType =
  | "lead_created"
  | "lead_converted"
  | "deal_won"
  | "deal_lost"
  | "ticket_created"
  | "ticket_resolved"
  | "campaign_sent"
  | "workflow_completed";

export type MetricEvent = {
  id: number;
  event_type: MetricEventType;
  value: number | null;
  metadata: Record<string, unknown>;
  recorded_by: number | null;
  occurred_at: string;
  created_at: string;
};

export type DashboardOverview = {
  sales: {
    revenue_won: number;
    deals_won: number;
    deals_lost: number;
    win_rate_percent: number | null;
  };
  leads: {
    leads_created: number;
    leads_converted: number;
    conversion_rate_percent: number | null;
  };
  support: SupportSummary;
  generated_at: string;
};

export type TrendPoint = { date: string; count: number };

export type TrendForecast = {
  history: TrendPoint[];
  projection: TrendPoint[];
  trend: "up" | "down" | "flat" | "insufficient_data";
  slope_per_day: number;
};

export type RecommendationSeverity = "info" | "warning" | "critical";

export type GrowthRecommendation = {
  area: string;
  severity: RecommendationSeverity;
  message: string;
};

// ---- Lead Management ----
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";

export type Lead = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  score: number;
  conversion_probability: number;
  ai_insights: string;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
};

export type LeadInteraction = {
  id: number;
  lead: number;
  interaction_type: "EMAIL" | "CALL" | "MEETING" | "NOTE";
  notes: string;
  date: string;
  created_by: number | null;
};

// ---- Communication Hub ----
export type CommunicationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "CALL";
export type CommunicationDirection = "INBOUND" | "OUTBOUND";
export type CommunicationStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";

export type CommunicationLog = {
  id: number;
  lead: number | null;
  recipient: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject: string;
  content: string;
  status: CommunicationStatus;
  error_message: string;
  sent_by: number | null;
  timestamp: string;
};

export type MessageTemplate = {
  id: number;
  name: string;
  channel: CommunicationChannel;
  subject_template: string;
  body_template: string;
};

