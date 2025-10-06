# Avertra Blog Platform

This technical assessment showcases fullstack development skills with a UI inspired by Avertra's public visual identity.

## Requirements Checklist
- [x] Use React and Next.js for the frontend, leveraging Next.js 15 App Router with React 19 components.
- [x] Apply the Context API pattern to share authenticated session state across server and client boundaries via NextAuth helpers (`src/auth.ts`, `src/components/Navbar.tsx`).
- [x] Provide a RESTful API for authentication and posts using Next.js route handlers backed by Node.js and Drizzle ORM (`src/app/api/**`).
- [x] Implement the service-layer design pattern to encapsulate business logic (`src/server/services/*`).
- [x] Run automated linting and tests through GitHub Actions CI (`.github/workflows/ci.yml`).
- [x] Handle errors and edge cases with normalized mappers and validation (`src/server/utils/errors.ts`).
- [x] Supply unit and integration tests for critical flows with Vitest (`tests/`).

## Bonus Checklist
- [x] Responsive design powered by Tailwind CSS breakpoints across layouts and components.
- [x] Serverless-style backend functions using Next.js Route Handlers under `src/app/api`.
- [ ] Additional social features such as comments, categories, or likes (available for future iterations).
- [x] Dockerized setup via `Dockerfile` and `docker-compose.yml` for local orchestration.

## Features
- **Authenticated authoring** with credential-based login, protected post management, and session handling via NextAuth.
- **Post lifecycle management** including listing, creation, editing, publishing controls, and pagination for both public feeds and author dashboards.
- **Typed service layer** backed by Drizzle ORM, ensuring safe database access and consistent validation across REST and tRPC handlers.
- **Composable UI** built with Tailwind CSS, reusable form controls, and accessible components for sign-in, post forms, and navigation.
- **Comprehensive testing** using Vitest projects for frontend (jsdom) and backend (node), plus coverage reporting.
- **PostgreSQL collection & environment** provided via Docker Compose and environment files for local and containerized workflows.
- **Container-ready** with Docker and docker-compose recipes that provision PostgreSQL, run migrations, seed demo data, and start the dev server automatically.

## Tech Stack
- Next.js 15 (App Router, Route Handlers) + React 19
- TypeScript across frontend, backend, and build tooling
- NextAuth credentials provider for authentication
- Drizzle ORM with PostgreSQL, managed via drizzle-kit
- tRPC for typed API access and React Query integration
- Tailwind CSS 4 for styling
- Vitest + Testing Library for unit/integration tests
- ESLint (flat config) for static analysis

## Project Structure
```
├── src
│   ├── app               # App Router pages, API handlers, and route components
│   ├── components        # Reusable UI, auth forms, and post widgets
│   ├── constants         # Shared enums for errors and HTTP status codes
│   ├── server            # Database client, services, tRPC routers, utilities
│   └── types             # Shared TypeScript types
├── tests                 # Vitest backend test suites and fixtures
├── public                # Static assets served by Next.js
├── drizzle.config.ts     # Drizzle CLI configuration
├── docker-compose.yml    # Local containers for app + PostgreSQL
├── vitest.config.ts      # Vitest multi-project configuration
└── eslint.config.mjs     # Flat ESLint configuration
```

## Getting Started
1. **Install prerequisites**
   - Node.js 20+ (matches the Docker base image) and npm 10+
   - PostgreSQL 15+ (skip if using Docker compose)

2. **Clone and install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env.local` in the project root:
   ```bash
   DATABASE_URL="postgres://USER:PASSWORD@localhost:5432/avertra_blog"
   AUTH_SECRET="replace-with-random-string"
   ```
   - `DATABASE_URL` must point to a reachable PostgreSQL database.
   - `AUTH_SECRET` is used by NextAuth to sign JWT sessions.

4. **Provision the database schema**
   ```bash
   npm run db:push
   ```

5. **Seed demo data (optional but recommended)**
   ```bash
   npm run db:seed
   ```
   The seed script provisions an admin account `admin@avertra.com` with password `avertraAdmin123` and a few sample posts.

6. **Start the development server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 to browse the public feed or sign in to manage posts.

## Database & Migrations
- `npm run db:generate` – Generate SQL migration files from schema changes.
- `npm run db:migrate` – Apply generated migrations to the target database.
- `npm run db:push` – Push the current schema directly without migration files (ideal for dev).
- `npm run db:studio` – Launch Drizzle Studio for inspecting tables and running queries.

All commands rely on `DATABASE_URL`, so ensure it is present in your environment before running them.

## Testing & Quality
- `npm run test` – Run the complete Vitest suite (frontend + backend projects).
- `npm run test:watch` – Run Vitest in watch mode.
- `npm run lint` – Execute ESLint across the project.
- Coverage reports are emitted to the `coverage/` directory when running tests.

## API Overview
### REST Endpoints
| Method | Path             | Description                                  | Auth Required                 |
| ------ | ---------------- | -------------------------------------------- | ----------------------------- |
| GET    | `/api/posts`     | List posts with optional `limit`, `page`, `authorId`, `publishedOnly` query params. | Optional (required for drafts) |
| POST   | `/api/posts`     | Create a post for the signed-in user.        | Yes (signed-in author)        |
| GET    | `/api/posts/:id` | Fetch a single post by ID.                   | No                            |
| PATCH  | `/api/posts/:id` | Update a post (title, content, published).   | Yes (author only)             |
| DELETE | `/api/posts/:id` | Delete a post.                               | Yes (author only)             |

Errors are normalized via `mapErrorToHttp`, returning consistent status codes and human-readable messages.

### tRPC Router
The `posts` router mirrors the REST capabilities with type-safe procedures:
- `posts.list` – Filtered pagination with zod-validated inputs.
- `posts.byId` – Fetch a single post, throws `NOT_FOUND` when missing.
- `posts.create` – Create posts for a given author ID.
- `posts.update` – Patch posts with runtime validation of provided fields.
- `posts.remove` – Delete posts with authorization guardrails.

Import the router client-side with `@trpc/react-query` to benefit from automatic type inference and cache management.

## Postman Resources
- Import the collection at `postman/avertra-blog.postman_collection.json` to exercise REST endpoints.
- Use the environment file `postman/avertra-blog-local.postman_environment.json` for local URLs and auth placeholders.
- Update `DATABASE_URL` or auth tokens in the Postman environment to match your setup before sending requests.

## Docker Workflow
A ready-to-run stack is provided via docker-compose:
```bash
docker-compose up --build
```
- Uses `.env.docker` for default credentials and secrets.
- Boots PostgreSQL, runs Drizzle migrations + seed, and starts the Next.js dev server on port 3000.
- Data persists in the named `db-data` volume.

To stop the stack without removing data:
```bash
docker-compose down
```
Add `-v` to drop the persisted database volume if you need a clean slate.

## Useful npm Scripts
| Script            | Purpose                                 |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Next.js dev server with Turbopack       |
| `npm run build`   | Production build (Turbopack)            |
| `npm run start`   | Serve a production build                |
| `npm run db:seed` | Seed the database with demo data        |
| `npm run lint`    | Run ESLint across the project           |
| `npm run test`    | Execute Vitest test suite               |

## Contributing
1. Fork the repository and create a feature branch.
2. Keep changes covered with tests when possible (`npm run test`).
3. Ensure linting passes (`npm run lint`).
4. Open a pull request describing the motivation, approach, and verification steps.

## Troubleshooting
- **Auth errors:** Confirm `AUTH_SECRET` is identical across all running instances and restart the dev server after changes.
- **Database connection failures:** Verify `DATABASE_URL` credentials and that the Postgres instance is accepting connections. For Docker, ensure the `db` service is healthy.
- **Migrations out of sync:** Run `npm run db:push` or `npm run db:migrate` to align the database and schema.

Enjoy building with the Avertra Blog Platform!
