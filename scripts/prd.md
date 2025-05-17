## Goal
Create a beautiful and intuitive UI/UX for every aspect of managing a vertical farm; from the Grow Operations aspect to (eventually as a stretch goal) the Business Operations management.

## To begin

Verify complete understanding of the existing codebase 
- System architecture
- Frontend architecture
- Backend architecture (API and database)
- Local Deployment (Docker Compose)
- Remote Deployment (Render)
- Generate summary of architecture to reference for the rest of the project

## 🔧 1. Technical Architecture

### Frontend
- **React (Next.js)** interface with real-time updates and task automation
- Role-based access via **Supabase Auth**
- Key UI Components:
  - Dashboard
  - Farm layout & configuration
  - Device assignment
  - Grow recipe scheduling
  - Live sensor monitoring

### Backend
- **FastAPI** with REST and WebSocket endpoints for:
  - Configuration (zones, devices, recipes)
  - Device control (via direct or Home Assistant)
  - Scheduling and automation
  - Historical logging
  - Any other useful API features

### Database
- **Supabase Postgres**
  - Entity hierarchy (Farm → Row → Rack → Shelf)
  - Recipes, schedules, and other relevant data
  - Secure device and user data
  - Real-time changes via Supabase’s realtime engine

### Device Integration Layer

- **Home Assistant API/WebSocket Integration**
  - Subscribes to sensor and device states via `sensor`, `switch`, and `binary_sensor` platforms
  - Controls devices using the `call_service` endpoint
  - Leverages `entity_registry`

## 🌱 2. Core Features & Modules

### 2.1 Farm Layout & Configuration
- **What**: UI forms to define hierarchical structure: Farms → Rows → Racks → Shelves  
- **Why**: Establishes a spatial map for precise device targeting, scheduling, and tracking  
- **How**: Stored in Supabase, referenced in recipes and device assignment UIs

### 2.2 Device Assignment
- **What**: Map lights, water fill solenoids, water drain solenoids, pumps, fans, sensors, etc. from home assistant to their physical location in the farm layout  
- **Why**: Enables per-shelf control and fine-grained data monitoring  

### 2.3 Grow Recipes & Scheduling
- **What**: Define per-species recipes including grow days required, light duration, watering frequency, average yields, sowing rate, and other custom parameters 
- **Why**: Automate grow protocols for consistency and reduce manual labor  

### 2.4 Real-Time Monitoring & Alerts
- **What**: Live dashboard showing environmental conditions + system status  
- **Why**: Rapid response to anomalies reduces risk  

### 2.5 Historical Analytics & Reporting
- **What**: Visualize data, yield history, and performance metrics  
- **Why**: Refine practices using historical insight  

### 2.6 Extensibility for future integrations
- **What**: For example:
- vision based triggers/feedback loops
- LLM analysis
- Stripe/Square/Quickbooks Integrations

---

## 🧑‍🌾 3. User Experience

### User Types
- **Farm Manager**: Sets up layout, schedules, and tracks yields
- **Operator**: Receives instructions from system, logs harvests
- **Home Assistant Power User**: Links existing smart devices to farming workflow

### Key UX Flows
- Add a new shelf → Assign sensor/relay entities → Select species recipe → System runs schedule  
- Real-time page: view temp/humidity by shelf, alerts show on failure  
- End of day: operator logs harvest yield via touch UI or mobile

---

## 🔌 4. API & Integration Overview

| Integration Target | Method              | Purpose                                  |
|--------------------|---------------------|------------------------------------------|
| Home Assistant     | WebSocket + REST    | Sensor polling, relay control, alerting  |
| ESP32 (ESPHome)    | Local/MQTT          | Direct device I/O                        |
| Supabase           | Postgres, Realtime  | Persistent storage, auth                 |
| React Frontend     | REST + WebSockets   | Live updates, configuration, dashboards  |

---

## 🚀 5. Roadmap (Milestones)

### Phase 1 – MVP
-  FastAPI backend with Supabase
-  Farm layout model and React UI
-  Schedule runner with manual test buttons
- [] Basic Home Assistant integration (REST + WebSocket)
- [] Real-time dashboard
- [] Device assignment UI using HA `entity_registry`

### Phase 2 – Core Automations
- [ ] Grow recipe engine and template loader
- [ ] Recipe locking logic for sequential watering
- [ ] Harvest logging UI and data sync
- [ ] Sensor-based alerts and historical graphing

### Phase 3 – Advanced Integration
- [ ] Sync with existing HA Lovelace dashboards
- [ ] Forecast resource use and simulate yield
- [ ] Plugin system for 3rd-party integration
