# System Design Document — Blogging Platform

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Interaction](#component-interaction)
3. [Data Flow](#data-flow)
4. [Design Decisions and Rationale](#design-decisions-and-rationale)
5. [Operational Notes](#operational-notes)

---

## 1. Architecture Overview

- **Framework:** The project uses Next.js 15 with React 19 and the App Router. It combines both the frontend and backend into a single full-stack application.
- **Rendering model:** Pages are rendered on the server first (Server Components) and hydrated on the client for interactivity.
- **Layout:** `src/app/layout.tsx` defines the global layout with styling, font loading, and the navigation bar.
- **Data layer:** Drizzle ORM manages the PostgreSQL schema, migrations, and type-safe queries.
- **API layer:** RESTful endpoints under `app/api/**` delegate business logic to shared service modules, keeping the handlers thin and stateless.
- **Authentication:** NextAuth (credentials provider) manages user authentication and sessions. The helper `getServerAuthSession` provides access to session data within server components and route handlers.
- **tRPC (optional):** Mirrors the REST layer for future typed client interactions without duplicating business logic.
- **Containerization:** `Dockerfile.dev` with docker-compose supports local development alongside Postgres. Production builds are handled by Vercel from the repository source.

---

## 2. Component Interaction

| Layer                 | Key Components                                                            | Description                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend (Client)** | `Navbar`, `UserPostsManager`, `PostOwnerActions`, `AuthForms`             | Renders server-fetched data and triggers REST API calls for actions like creating, editing, or deleting posts. Uses router refreshes and local state to stay in sync. |
| **Server Components** | `/app/page.tsx`, `/app/posts/manage/page.tsx`, `/app/posts/[id]/page.tsx` | Fetch data on the server, enforce authentication, and pass results to client components.                                                                              |
| **API Handlers**      | `/api/posts`, `/api/posts/[id]`, `/api/auth/register`                     | Validate inputs, check sessions, invoke service logic, and return JSON responses with proper status codes.                                                            |
| **Service Layer**     | `src/server/services/posts.ts`, `src/server/services/users.ts`            | Centralized business logic for validation, authorization, and data access. Shared between REST and tRPC.                                                              |
| **Data Layer**        | `src/server/db/schema.ts`, `src/server/db/client.ts`                      | Defines the Drizzle schema and provides a pooled PostgreSQL client for type-safe access.                                                                              |
| **Authentication**    | `src/auth.ts`, `/app/api/auth/register`                                   | `/app/api/auth/register` processes sign-up (validation, hashing, persistence). `src/auth.ts` validates credentials for sign-in and enriches JWT-based sessions.       |
| **Infrastructure**    | Docker, npm scripts                                                       | Runs the app and database together. Scripts handle linting, testing, building, and running migrations.                                                                |

---

## 3. Data Flow

### A. Public Browsing

1. A visitor opens the home page (`/`).
2. The server calls `listPosts({ publishedOnly: true })` to load all published posts.
3. The service queries Drizzle and Postgres and returns the results sorted by creation date.
4. The server renders the content and sends it to the client, which hydrates the interactive parts.

### B. Authentication

1. **Sign-up:** The client sends a `POST` request to `/api/auth/register`. The route validates input, hashes the password, creates a new user, and returns profile data.
2. **Sign-in:** The NextAuth credentials provider validates credentials and issues a JWT session cookie.
3. The navigation bar retrieves the session to display user info or sign-in prompts.

### C. Authoring and Editing

1. Authenticated users visit `/posts/manage`.
2. The server verifies the session and loads posts for the logged-in author.
3. The user can create, edit, or delete posts. The client sends `POST`, `PATCH`, or `DELETE` requests to the API without a client-side data cache.
4. The service writes changes to the database, and the client refreshes the router to show updates.

### D. Database and Seeding

- Drizzle migrations keep the schema consistent across environments.
- The `seed.ts` script creates a demo admin user and example posts for local setups.

---

## 4. Design Decisions and Rationale

- **Single Next.js app:** Combines frontend and backend to reduce complexity and deployment overhead while still providing a REST API.
- **Service layer abstraction:** Keeps validation and business rules centralized, improving consistency and maintainability.
- **Drizzle ORM:** Offers strong TypeScript support, generates readable SQL, and provides reliable migration tooling.
- **Server-side rendering:** Ensures users always see the latest data without relying on client caching.
- **Zod validation:** Provides structured input validation and clear error responses at API boundaries.
- **JWT sessions (NextAuth):** Secure and stateless session handling using httpOnly cookies.
- **Dockerized setup:** Makes local, CI, and production environments identical and easy to run.
- **Build-time configuration:** Provide required environment variables (`DATABASE_URL`, `AUTH_SECRET`). For Vercel, configure these in Project Settings; for local Docker, use `.env.docker` and compose environment variables.
- **Local state with hooks:** Manages client-side interactions (form state, optimistic UI) without a dedicated global store; router refreshes keep the UI aligned with server data.
- **Database client singleton:** `src/server/db/client.ts` instantiates the Postgres pool and Drizzle client once at module scope so every request reuses the same connection objects, following the singleton pattern.

---

## 5. Operational Notes

- **Environment Variables:**  
  `DATABASE_URL`, `AUTH_SECRET`.
- **CI/CD:** GitHub Actions `ci.yml` runs linting and Vitest coverage. Deployments are handled by Vercel via the GitHub integration on pushes to `main`; no separate deploy workflow is required.
- **Monitoring:** Local development relies on Next.js logging; database performance can be inspected via Drizzle queries and Postgres tools.
- **Testing:** Vitest covers service functions, authentication utilities, UI components, and tRPC routers. Postman collections are available for manual API verification.
