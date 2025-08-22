# Architecture Overview

Welcome to the VerticalFarm OS architecture documentation. This guide provides a high-level overview of the system architecture, helping new developers understand how all the pieces fit together.

## 🌱 What is VerticalFarm OS?

VerticalFarm OS is a **comprehensive vertical farming management platform** that combines modern web technologies with IoT device control to manage indoor farming operations. The system handles everything from farm layout management to automated environmental control and real-time monitoring.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 15 (React 19)  │  TypeScript  │  Tailwind CSS          │
│  Server Components       │  Service Layer │  shadcn/ui           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ├── API Calls ──────────┐
                 │                        │
                 ▼                        ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│    FastAPI Backend      │    │   Supabase Platform     │
├─────────────────────────┤    ├─────────────────────────┤
│  Python 3.13            │    │  PostgreSQL Database    │
│  JWT Authentication     │    │  Row Level Security     │
│  Business Logic         │    │  Realtime Subscriptions │
│  Device Integration     │    │  Authentication         │
│  Monitoring (Datadog)   │    │  Edge Functions         │
└─────────────────────────┘    └─────────────────────────┘
                 │                        │
                 └────────┬───────────────┘
                          │
                 ▼        ▼        ▼
┌───────────────────────────────────────────────────────┐
│              Edge Computing Layer                      │
├───────────────────────────────────────────────────────┤
│  Cloudflare Workers  │  Supabase Edge Functions       │
│  • Caching          │  • Background Tasks             │
│  • IoT Processing   │  • Scheduled Jobs               │
│  • API Gateway      │  • Database Operations          │
└───────────────────────────────────────────────────────┘
```

## 🎯 Core Components

### **Frontend (Next.js 15)**
The user interface layer built with cutting-edge React technologies:
- **Server Components** for optimal performance
- **Service Layer Architecture** for data management
- **Real-time Updates** via Supabase subscriptions
- **Responsive Design** with Tailwind CSS and shadcn/ui

### **Backend (FastAPI)**
The business logic layer handling complex operations:
- **RESTful API** with automatic documentation
- **JWT Authentication** for secure access
- **Device Management** for IoT integration
- **Complex Business Logic** and validations

### **Database (Supabase/PostgreSQL)**
The data persistence and real-time layer:
- **PostgreSQL** for reliable data storage
- **Row Level Security (RLS)** for data isolation
- **Real-time Subscriptions** for live updates
- **Edge Functions** for serverless compute

### **Edge Computing**
Distributed computing for performance and scalability:
- **Cloudflare Workers** for global caching and IoT processing
- **Supabase Edge Functions** for database-heavy operations
- **Background Jobs** for scheduled automation

## 🔄 Data Flow

### 1. **User Interaction Flow**
```
User → Next.js Frontend → Service Layer → API/Database
                              ↓
                        Decision Point:
                    Simple Read?  → Supabase Direct
                    Complex Logic? → FastAPI Backend
```

### 2. **Real-time Updates**
```
Database Change → Supabase Realtime → WebSocket → Frontend Update
```

### 3. **Device Control**
```
User Action → Frontend → FastAPI → Device Assignment → IoT Device
                            ↓
                     Supabase (Log & State)
```

## 🏢 Farm Hierarchy

The system models a complete vertical farm structure:

```
Farm
├── Rows (physical rows in the facility)
│   ├── Racks (vertical growing structures)
│   │   ├── Shelves (individual growing levels)
│   │   │   ├── Schedules (what's growing)
│   │   │   ├── Devices (sensors, lights, pumps)
│   │   │   └── Automation Rules
```

## 🔐 Security Model

### **Multi-Layer Security**
1. **Authentication**: Supabase Auth with JWT tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Data Isolation**: Row Level Security per farm/user
4. **API Security**: Token validation on all endpoints
5. **Input Validation**: Comprehensive sanitization

### **User Roles**
- `admin` - Full system access
- `farm_manager` - Farm-level management
- `operator` - Day-to-day operations
- `viewer` - Read-only access

## 🚀 Key Features

### **Farm Management**
- Visual farm layout editor
- Hierarchical structure management
- Device assignment and control
- Real-time environmental monitoring

### **Automation System**
- Schedule-based automation
- Sensor-triggered rules
- Multi-tenant isolation
- Retry and failure handling

### **Monitoring & Analytics**
- Real-time sensor data
- Environmental alerts
- Performance metrics
- Historical analysis

### **Layer Overlay System**
A unique visual architecture allowing multiple information layers:
- **Device Layer** - Equipment status and control
- **Monitoring Layer** - Environmental data
- **Automation Layer** - Rules and schedules
- **Analytics Layer** - Performance insights

## 🛠️ Development Stack

### **Frontend Technologies**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Supabase Client SDK

### **Backend Technologies**
- FastAPI (Python 3.13)
- Pydantic for validation
- JWT for authentication
- Docker for containerization
- Datadog for monitoring

### **Database & Infrastructure**
- PostgreSQL (via Supabase)
- Cloudflare Workers
- GitHub Actions (CI/CD)
- Docker Compose

## 📁 Project Structure

```
vertical-farm/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   ├── components/   # React components
│   │   ├── services/     # Service layer (CRITICAL)
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # TypeScript definitions
│   └── ...
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── models/   # Data models
│   │   ├── services/ # Business logic
│   │   └── crud/     # Database operations
│   └── ...
├── supabase/         # Database migrations
├── cloudflare/       # Edge workers
└── docs/            # Documentation
```

## 🎓 Getting Started

### **For Frontend Developers**
1. Understand the [Service Layer Architecture](/docs/reference/architecture/service-layer.md)
2. Review [Frontend Architecture](/docs/reference/architecture/frontend-architecture.md)
3. Learn about [Component Patterns](/docs/reference/architecture/component-patterns.md)

### **For Backend Developers**
1. Study the [API Architecture](/docs/reference/architecture/backend-architecture.md)
2. Understand [Database Schema](/docs/reference/architecture/database-design.md)
3. Review [Authentication Flow](/docs/reference/architecture/authentication.md)

### **For Full-Stack Developers**
1. Read about [Data Flow Patterns](/docs/reference/architecture/data-flow.md)
2. Understand [Service Integration](/docs/reference/architecture/service-integration.md)
3. Learn [Deployment Architecture](/docs/reference/architecture/deployment.md)

## ⚡ Performance Considerations

- **Server Components by Default** - Minimal client-side JavaScript
- **Service Layer Caching** - Intelligent data caching
- **Edge Computing** - Global content delivery
- **Database Optimization** - Indexed queries and views
- **Real-time Efficiency** - Selective subscriptions

## 🔄 Next Steps

Now that you understand the high-level architecture:

1. **Set up your development environment** - See [Quickstart Guide](/docs/getting-started/quickstart.md)
2. **Explore the codebase** - Follow the [Project Structure](#-project-structure)
3. **Understand key patterns** - Read [Architecture Patterns](/docs/reference/architecture/patterns.md)
4. **Start contributing** - Check [Development Guide](/docs/02-development/README.md)

## 📚 Further Reading

- **Detailed Architecture** - [Reference Documentation](/docs/reference/architecture/)
- **API Documentation** - [API Reference](/docs/03-api/)
- **Database Schema** - [Database Design](/docs/reference/architecture/database-design.md)
- **Deployment Guide** - [Deployment Documentation](/docs/04-deployment/)

---

*This overview provides the foundation for understanding VerticalFarm OS. For detailed technical documentation, explore the reference materials linked throughout this guide.*