# LnQ

![License](https://img.shields.io/github/license/aspectxlol/lnq)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)

## Overview

LnQ is a full-stack ecommerce monorepo built for a family business. It provides a customer storefront, a backend API, and an administration dashboard for managing orders, inventory, users, and promotions.

## Why LnQ?

LnQ is designed around real business workflows instead of a generic ecommerce platform. It combines customer-facing shopping with operations tools in one codebase for easier maintenance and faster iteration.

## Current Status

> 🚧 Active development

LnQ is already in use by the business and continues to evolve. Features and APIs may change before the first stable release.

## Core Features

- 🛍️ Customer storefront
- 📦 Order and inventory management
- 👥 User authentication and role-based access
- 🔐 JWT security
- 📊 Admin dashboard
- ⭐ Product reviews
- 🎟️ Discounts and promotions
- 📱 Responsive design

## Architecture

```text
lnq/
├── admin/          # Admin dashboard (Vue + Vite)
├── backend/        # API server (NestJS + Fastify)
├── storefront/     # Customer storefront (Nuxt)
└── packages/
    └── shared/     # Shared types and schemas
```

## Tech Stack

### Admin

- Vue 3
- Vite
- Pinia
- Axios
- Tailwind CSS

### Storefront

- Nuxt 4
- Vue 3
- Pinia
- Axios
- Tailwind CSS

### Backend

- NestJS
- Fastify
- PostgreSQL
- Drizzle ORM
- Zod
- JWT

### Shared

- TypeScript
- Zod

### Tooling

- pnpm workspace
- ESLint
- Prettier
- GitHub Actions

## Monorepo Layout

Applications:

- `admin`
- `backend`
- `storefront`

Shared packages:

- `@lnq/shared`

## Getting Started

Setup documentation is coming soon. A Docker-based development environment is planned to provide one-command setup in the future.

## AI Assistance

AI tools support code generation, review, and implementation guidance. All architectural decisions and project direction remain under the project author’s control.

## License

LnQ is released under a permissive open-source license that allows:

- Personal and commercial use
- Modification and extension
- Code reuse in other applications
- Distribution of modified versions

The LnQ brand, including name, logos, graphics, and visual identity, is not covered by this license. If you reuse the code, remove or replace LnQ branding before distribution.
