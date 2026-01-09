# LNQ Monorepo

LNQ is a full-stack e-commerce solution, consisting of a Node.js/TypeScript backend, a Next.js/React frontend, and a cross-platform Flutter mobile app. Each part is independently deployable and designed for modern development workflows.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Monorepo Structure](#monorepo-structure)
- [Backend](#backend)
- [Frontend](#frontend)
- [Mobile](#mobile)
- [Development & Setup](#development--setup)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Project Overview

LNQ provides a complete e-commerce platform with:

- Product and order management
- Image upload and retrieval
- Health checks and API documentation
- Responsive web and mobile interfaces
- Dockerized deployment and local development support

---

## Monorepo Structure

```
lnq/
├── backend/   # Node.js/TypeScript REST API
├── frontend/  # Next.js/React web app
├── mobile/    # Flutter cross-platform app
```

---

## Backend

**Tech Stack:** Node.js, TypeScript, PostgreSQL, MinIO, Drizzle ORM, Docker

**Features:**

- CRUD APIs for products, orders, images
- Health check endpoint
- Swagger/OpenAPI documentation
- Docker & Docker Compose support
- Pre-commit hooks for tests/build

**Getting Started:**

1. Install dependencies: `pnpm install`
2. Set up `.env` (see backend/README.md for example)
3. Start services: `docker-compose up -d`
4. Run migrations: `pnpm db:push && pnpm db:generate`
5. Start dev server: `pnpm dev`

**Scripts:**  
See backend/README.md for a full list (dev, build, test, db, docker, compose).

**Testing:**  
Run all tests: `pnpm test` (see `src/__tests__/`).

---

## Frontend

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Radix UI, React Query

**Features:**

- Product and order management UI
- Dashboard and settings pages
- Responsive design
- Toast notifications, dialogs, print order functionality

**Getting Started:**

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm dev` (default port: 3001)
3. Configure backend API URL in Settings page

**Production Build:**  
`pnpm build && pnpm start`

**Docker:**  
`pnpm docker:publish` or manual Docker commands

**API Integration:**  
Frontend expects backend API as described in `swagger.json`.

---

## Mobile

**Tech Stack:** Flutter, Dart

**Features:**

- View, create, and manage orders
- Filter and sort orders
- Detailed order views
- Localization (English, Indonesian)
- Responsive UI for Android, iOS, web, desktop

**Getting Started:**

1. Install Flutter SDK
2. Clone repo and install dependencies: `flutter pub get`
3. Run app: `flutter run -d <device_id>`

**Localization:**  
Edit ARB files in `lib/l10n/`, regenerate with `flutter gen-l10n`.

**Testing:**  
Run tests: `flutter test`

---

## Development & Setup

- Node.js 20+/22+ and pnpm for backend/frontend
- Flutter SDK for mobile
- Docker & Docker Compose for containerized setup
- See each subproject’s README for environment variables and configuration

---

## Contributing

1. Fork and clone the repository
2. Create a feature branch
3. Make changes and add tests
4. Open a pull request

---

## License

- Backend: ISC
- Frontend & Mobile: MIT

---

## Contact

For questions or support, please contact the project maintainer.
