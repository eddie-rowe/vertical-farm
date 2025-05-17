# Frontend Architecture

## Framework & Stack
- **Framework:** Next.js 15 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Shadcn UI
- **State Management:** React Context API (custom AuthContext, ThemeContext)
- **Routing:** Next.js App Router (file-based routing in `src/app/`)

---

## Directory Structure
- `src/app/` — Main entry, layouts, and page routing
- `src/components/` — Reusable UI components (e.g., Header, AuthForm)
- `src/context/` — Context providers for authentication and theme
- `src/lib/` — Utility functions and shared logic

---

## Main Components
- **Header:** Navigation, theme toggle, user info, login/logout
- **AuthForm:** Handles login, sign-up, OAuth, and password reset
- **ThemeProvider:** Manages dark/light mode and persists user preference
- **AuthProvider:** Manages user authentication state and session

---

## Data Flow
- User interacts with UI components (e.g., AuthForm)
- Auth actions use Supabase JS client for authentication
- Auth state is provided globally via AuthContext
- Protected routes/components check AuthContext for user state
- API requests are sent to backend endpoints with JWT tokens for authentication

---

## Integration Points
- **Supabase:** Used for authentication and (planned) data operations
- **Backend API:** Consumed via REST endpoints for business logic and data

---

## Unique Patterns
- Uses Next.js App Router for modern routing and layouts
- Context-based state management for both auth and theme
- OAuth integration (Google, GitHub) via Supabase

---

## See Also
- [architecture-summary.md](./architecture-summary.md)
