# Taskmaster Database Schema (Autogen AgentChat Inspired)

## **Entity Relationship Diagram (ERD)**

Below is a textual ERD and schema summary for the core models, including Autogen-inspired teams, agents, tools, and session orchestration.

---

## **Entities & Relationships**

### **User**
- `id` (UUID, PK)
- `email` (unique)
- `name`
- `avatar_url`
- `created_at`
- `updated_at`

---

### **Agent**
- `id` (UUID, PK)
- `name`
- `type` (enum: user_proxy, assistant, custom)
- `role` (e.g., "coder", "reviewer", "coordinator")
- `config` (JSONB)
- `owner_id` (FK → User)
- `created_at`
- `updated_at`

---

### **Team**
- `id` (UUID, PK)
- `name`
- `description`
- `owner_id` (FK → User)
- `type` (enum: round_robin, hierarchical, broadcast, custom)
- `termination_condition_type` (enum: text_mention, max_turns, timeout, custom)
- `termination_condition_config` (JSONB)
- `config` (JSONB)
- `created_at`
- `updated_at`

#### **TeamAgent (Junction Table)**
- `id` (UUID, PK)
- `team_id` (FK → Team)
- `agent_id` (FK → Agent)
- `role_in_team` (e.g., "leader", "member", "observer")
- `joined_at`

---

### **Tool**
- `id` (UUID, PK)
- `name`
- `description`
- `type` (enum: api, function, plugin, custom)
- `config` (JSONB)
- `created_by` (FK → User)
- `created_at`

#### **AgentTool (Junction Table)**
- `id` (UUID, PK)
- `agent_id` (FK → Agent)
- `tool_id` (FK → Tool)
- `enabled` (bool)
- `config_override` (JSONB, nullable)
- `attached_at`

#### **TeamTool (Junction Table)**
- `id` (UUID, PK)
- `team_id` (FK → Team)
- `tool_id` (FK → Tool)
- `enabled` (bool)
- `config_override` (JSONB, nullable)
- `attached_at`

---

### **Session**
- `id` (UUID, PK)
- `title`
- `team_id` (FK → Team, nullable)
- `agent_ids` (UUID[], nullable)
- `tool_ids` (UUID[], nullable)
- `status` (enum: active, completed, archived)
- `created_by` (FK → User)
- `created_at`
- `updated_at`

---

### **Message**
- `id` (UUID, PK)
- `session_id` (FK → Session)
- `sender_agent_id` (FK → Agent)
- `content`
- `tool_call` (JSONB, nullable)
- `created_at`

---

### **Prompt**
- `id` (UUID, PK)
- `session_id` (FK → Session)
- `content`
- `created_by` (FK → User)
- `created_at`

---

### **ConsensusMechanism**
- `id` (UUID, PK)
- `type` (enum: autocratic, democratic, game_theory, custom)
- `config` (JSONB)
- `team_id` (FK → Team)
- `created_by` (FK → User)
- `created_at`

---

### **LogEntry**
- `id` (UUID, PK)
- `session_id` (FK → Session)
- `agent_id` (FK → Agent, nullable)
- `team_id` (FK → Team, nullable)
- `user_id` (FK → User, nullable)
- `type` (enum: info, warning, error, action, decision, cost, token_usage)
- `message`
- `data` (JSONB)
- `created_at`

---

### **Comment**
- `id` (UUID, PK)
- `session_id` (FK → Session)
- `user_id` (FK → User)
- `content`
- `created_at`

---

## **ERD Diagram (Textual)**

```
User ─────┬────────────┐
         │            │
      owns         creates
         │            │
      Agent      Team, Tool, Session, Prompt, ConsensusMechanism
         │            │
         └─────┬──────┘
               │
         TeamAgent (many-to-many)
               │
             Team
               │
         TeamTool (many-to-many)
               │
             Tool
               │
         AgentTool (many-to-many)
               │
             Agent

Session ── Message, Prompt, LogEntry, Comment
Session ── Team (optional), Agent(s), Tool(s)

ConsensusMechanism ── Team
```

---

## **Notes**
- All `config` and `*_config` fields are JSONB for extensibility.
- Team `type` and `termination_condition_type` are enums for orchestration and session control.
- Junction tables (TeamAgent, AgentTool, TeamTool) allow dynamic composition.
- Sessions can be team-based or ad-hoc agent/tool groups.
- Extend as needed for your specific Autogen workflows.
