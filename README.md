# LnQ

![License](https://img.shields.io/github/license/aspectxlol/lnq)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vue](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)
![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![pnpm](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)

A modern online storefront built for our family business.

LnQ is the digital storefront for our family-owned business. It was created to modernize how we sell products, manage orders, and serve our customers while preserving the personal experience that has always been part of our business.

Instead of relying solely on messaging apps, social media, or traditional ordering methods, LnQ brings everything together into one place. Customers can browse products, place orders, and track their purchases through a simple and reliable shopping experience, while the business can efficiently manage its daily operations from a dedicated administration dashboard.

Although LnQ was built specifically for our own business, it is designed with the same principles as professional commercial software: reliability, maintainability, security, and scalability.

## Status

> 🚧 Active Development

LnQ is currently under active development and powers our family's business while continuing to evolve. Features and APIs may change until the first stable release.

## Features

- 🛍️ Customer storefront
- 📦 Order management
- 📦 Inventory management
- 👥 User & role management
- 🔐 JWT Authentication
- 📊 Admin dashboard
- ⭐ Product reviews
- 🎟️ Discounts & promotions
- 📱 Responsive design

## Project Structure

```text
lnq/
├── admin/          # Administration dashboard
├── backend/        # NestJS API
├── storefront/     # Customer storefront
├── packages/
│   └── shared/     # Shared types & schemas
└── docs/
```

## Tech Stack

### Admin

- Vue 3
- Vite
- Pinia
- Axios
- Tailwind CSS

### Storefront

- Nuxt
- Vue 3
- Pinia
- Axios
- Tailwind CSS

### Backend

- NestJS
- Drizzle ORM
- PostgreSQL
- JWT Authentication
- Zod
- Fastify

### Shared

- TypeScript
- Zod

### Tooling

- pnpm Workspace
- ESLint
- Prettier
- GitHub Actions

## Monorepo

LnQ is organized as a pnpm workspace.

Applications:

- admin
- storefront
- backend

Shared packages:

- @lnq/shared

## Screenshots

Coming soon.

## Getting Started

Setup instructions are currently being documented. A Docker-based development environment is planned to provide a one-command setup experience.

## Why Build It?

Rather than using an existing ecommerce platform, LnQ is built specifically around the workflows of our family business.

This project also serves as a long-term software engineering project, allowing new ideas and architectural improvements to be explored in a real production environment.

## AI Assistance

This project is developed with the assistance of modern AI tools.

AI is used as an engineering assistant for tasks such as generating boilerplate code, explaining concepts, reviewing implementations, and accelerating development. However, the overall architecture, system design, technical decisions, and project direction are designed and maintained by the project author.

Every significant architectural decision is intentionally reviewed before becoming part of the codebase.

# License

LnQ is released under a permissive open-source license that allows anyone to:

- Use the software for personal or commercial purposes.
- Modify, extend, and adapt the source code.
- Copy parts of the project into other applications.
- Distribute modified versions of the software.

However, the LnQ brand is not included in this license.

The name "LnQ", along with its logos, icons, graphics, images, branding assets, product photography, and other visual identity contained within this repository remain the intellectual property of the project owner and are not licensed for reuse.

If you build your own product using this codebase, you are welcome to do so—but you must remove or replace all LnQ branding before distributing or deploying your version.
