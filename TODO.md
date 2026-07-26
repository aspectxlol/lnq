# LnQ Implementation Backlog

This backlog is derived from the project vision in `VISION.md` and the current repository state. Each task is atomic, includes status and dependencies, and is grouped by feature area.

---

## Authentication

- [ ] **Improve password storage security**
  - Description: Replace current SHA-256 password hashing with a production-grade algorithm such as bcrypt or Argon2, and move hash configuration out of business logic.
  - Priority: P0 Critical
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/src/auth/auth.service.ts`, `backend/src/auth/auth.module.ts`

- [ ] **Add backend validation for auth DTOs**
  - Description: Add `class-validator` and `class-transformer` validation to auth DTOs and wire `ValidationPipe` globally so incoming auth requests are validated.
  - Priority: P0 Critical
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/src/auth/dto/*.ts`, `backend/src/main.ts`

- [ ] **Harden JWT configuration and secret handling**
  - Description: Remove the `dev-secret` fallback, require `JWT_SECRET`, and add startup validation for required auth environment variables.
  - Priority: P0 Critical
  - Estimated effort: 1h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/src/auth/auth.module.ts`, `backend/src/main.ts`, `backend/.env.example`

- [ ] **Add password reset workflow**
  - Description: Create password reset request and reset endpoints so customers can recover access to their accounts securely.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Improve password storage security
  - Files involved: `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`, `backend/src/auth/dto/*.ts`

- [ ] **Add email verification workflow**
  - Description: Add email verification tokens and endpoints so new customer accounts can be verified before full access is allowed.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Add backend validation for auth DTOs
  - Files involved: `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`, `backend/src/auth/dto/*.ts`

- [ ] **Harden refresh-token flow and session invalidation**
  - Description: Ensure refresh tokens are rotated safely, old tokens are invalidated, and session records are cleaned up after logout or expiration.
  - Priority: P1 High
  - Estimated effort: 3h
  - Current status: 🟡 Partially Implemented
  - Dependencies: Harden JWT configuration and secret handling
  - Files involved: `backend/src/auth/auth.service.ts`, `backend/src/auth/auth.controller.ts`, `backend/prisma/schema.prisma`

- [ ] **Add login and refresh audit logs**
  - Description: Log successful and failed login attempts plus refresh events to support security review and troubleshooting.
  - Priority: P2 Medium
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Harden refresh-token flow and session invalidation
  - Files involved: `backend/src/auth/auth.service.ts`, `backend/src/auth/auth.controller.ts`

- [ ] **Add user-facing authentication endpoints and documentation**
  - Description: Document and verify customer registration, login, refresh, logout, and profile endpoints for storefront integration.
  - Priority: P2 Medium
  - Estimated effort: 2h
  - Current status: 🟡 Partially Implemented
  - Dependencies: Add backend validation for auth DTOs
  - Files involved: `backend/src/auth/auth.controller.ts`, `backend/swagger.json`

### Authentication Progress

Completed: 0  
Partial: 2  
Missing: 6

---

## Authorization and Roles

- [ ] **Implement role-based guard and permission metadata**
  - Description: Add NestJS permission metadata and guard that can enforce `STAFF`, `OWNER`, and `ADMIN` access on backend endpoints.
  - Priority: P1 High
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Add backend validation for auth DTOs
  - Files involved: `backend/src/auth/*`, new guard files

- [ ] **Wire role checks into admin-facing APIs**
  - Description: Protect future admin product, inventory, order, and user endpoints with role checks for staff, owner, and administrator responsibilities.
  - Priority: P1 High
  - Estimated effort: 2h per endpoint group
  - Current status: 🔴 Not Started
  - Dependencies: Implement role-based guard and permission metadata
  - Files involved: `backend/src/*` after admin APIs exist

- [ ] **Add backend role validation for JWT guard**
  - Description: Extend JWT validation so token payload roles are verified and unauthorized users are rejected early.
  - Priority: P1 High
  - Estimated effort: 1h
  - Current status: 🔴 Not Started
  - Dependencies: Harden JWT configuration and secret handling
  - Files involved: `backend/src/auth/strategies/jwt.strategy.ts`, `backend/src/auth/auth.service.ts`

### Authorization and Roles Progress

Completed: 0  
Partial: 0  
Missing: 3

---

## Customer Storefront

- [ ] **Implement storefront catalog home and navigation**
  - Description: Replace the placeholder storefront landing page with a catalog home page that lists products and allows navigation to product details.
  - Priority: P0 Critical
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Create product catalog API
  - Files involved: `storefront/src/App.vue`, `storefront/src/router/index.ts`, new storefront views/components

- [ ] **Add storefront product search and filtering**
  - Description: Add customer search and filter controls for product name, category, and active status to support product discovery.
  - Priority: P0 Critical
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Create product catalog API
  - Files involved: `storefront/src/*`, potential new components

- [ ] **Create storefront product detail page**
  - Description: Build a product detail page that shows product name, image(s), description, price, and stock availability.
  - Priority: P0 Critical
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Create product catalog API
  - Files involved: `storefront/src/*`

- [ ] **Implement storefront cart management**
  - Description: Add shopping cart functionality with add-to-cart, quantity updates, and cart review for customers.
  - Priority: P0 Critical
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Create cart API
  - Files involved: `storefront/src/*`

- [ ] **Add checkout preview and order submission flow**
  - Description: Build a storefront checkout flow that validates cart contents, collects customer details, previews totals, and submits orders.
  - Priority: P0 Critical
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Create order and checkout APIs
  - Files involved: `storefront/src/*`

- [ ] **Add customer order history and tracking page**
  - Description: Provide customers with an order history page that lists placed orders and highlights current status.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Create order history API
  - Files involved: `storefront/src/*`

- [ ] **Add customer account management and saved addresses**
  - Description: Add customer account pages for profile editing, saved asddresses, and order history.
  - Priority: P1 High
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Create user profile and address APIs
  - Files involved: `storefront/src/*`

- [ ] **Add customer review submission flow**
  - Description: Allow customers to submit product reviews after purchase, including rating and text feedback.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Create review API, order completion tracking
  - Files involved: `storefront/src/*`

### Customer Storefront Progress

Completed: 0  
Partial: 0  
Missing: 8

---

## Admin Dashboard

- [ ] **Implement admin login and logout flows**
  - Description: Complete the current admin auth UI with login form, logout action, and redirect handling for unauthorized roles.
  - Priority: P0 Critical
  - Estimated effort: 3h
  - Current status: 🟡 Partially Implemented
  - Dependencies: Harden backend auth endpoints
  - Files involved: `admin/src/routes/auth/login.tsx`, `admin/src/routes/index.tsx`, `admin/src/lib/auth.ts`

- [ ] **Create admin product management pages**
  - Description: Add CRUD screens for products, including list, create, edit, and delete operations.
  - Priority: P0 Critical
  - Estimated effort: 8h
  - Current status: 🔴 Not Started
  - Dependencies: Create product catalog API
  - Files involved: `admin/src/*`

- [ ] **Create admin category management pages**
  - Description: Add category CRUD supporting name, slug, description, and active status.
  - Priority: P1 High
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Create category API
  - Files involved: `admin/src/*`

- [ ] **Add admin order management pages**
  - Description: Build order-processing UI for staff to view and update order status and details.
  - Priority: P1 High
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Create order management API
  - Files involved: `admin/src/*`

- [ ] **Add inventory management pages**
  - Description: Add product stock and inventory views for owners to manage inventory levels and low-stock alerts.
  - Priority: P1 High
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Create inventory support in backend
  - Files involved: `admin/src/*`

- [ ] **Build staff and owner role management UI**
  - Description: Add a staff management screen where the owner can assign roles and manage access.
  - Priority: P2 Medium
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Implement backend authorization
  - Files involved: `admin/src/*`

- [ ] **Add admin dashboard overview**
  - Description: Add a dashboard page with key store metrics, recent orders, and inventory alerts.
  - Priority: P2 Medium
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Add basic order and product endpoints
  - Files involved: `admin/src/*`

### Admin Dashboard Progress

Completed: 0  
Partial: 1  
Missing: 6

---

## Product Catalog

- [ ] **Create category module and API**
  - Description: Build backend category endpoints for listing, creating, editing, deleting, and slug management.
  - Priority: P0 Critical
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Database schema ready
  - Files involved: `backend/src/`, `backend/prisma/schema.prisma`

- [ ] **Create product module and API**
  - Description: Build backend product endpoints for catalog listing, detail retrieval, creation, editing, deletion, and SKU/slug validation.
  - Priority: P0 Critical
  - Estimated effort: 8h
  - Current status: 🔴 Not Started
  - Dependencies: Create category module and API
  - Files involved: `backend/src/`, `backend/prisma/schema.prisma`

- [ ] **Add product image storage and upload support**
  - Description: Integrate MinIO storage for product images and add secure upload/download endpoints.
  - Priority: P1 High
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Infrastructure and MinIO integration
  - Files involved: `backend/src/*`, `backend/prisma/schema.prisma`, `docker-compose.yml`

- [ ] **Implement product search, filtering, and pagination**
  - Description: Add search and filter support for product name, category, price, and active state with paginated responses.
  - Priority: P1 High
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Create product module and API
  - Files involved: `backend/src/*`

- [ ] **Add product metadata and SEO fields**
  - Description: Extend product model with optional metadata for display labels and future SEO content.
  - Priority: P2 Medium
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Create product module and API
  - Files involved: `backend/prisma/schema.prisma`

### Product Catalog Progress

Completed: 0  
Partial: 0  
Missing: 5

---

## Orders and Checkout

- [ ] **Add cart persistence and backend cart API**
  - Description: Build a cart model and endpoints for customers to add items, update quantities, and validate stock before checkout.
  - Priority: P0 Critical
  - Estimated effort: 7h
  - Current status: 🔴 Not Started
  - Dependencies: Create product module and API
  - Files involved: `backend/src/*`, `backend/prisma/schema.prisma`

- [ ] **Create order processing API**
  - Description: Implement order creation, status tracking, and order detail endpoints for customer and admin workflows.
  - Priority: P0 Critical
  - Estimated effort: 8h
  - Current status: 🔴 Not Started
  - Dependencies: Add cart persistence and backend cart API
  - Files involved: `backend/src/*`, `backend/prisma/schema.prisma`

- [ ] **Add order lifecycle endpoints**
  - Description: Add endpoints for staff to transition orders through `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, and `CANCELLED`.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Create order processing API
  - Files involved: `backend/src/*`

- [ ] **Add order history for customers**
  - Description: Expose a customer order history endpoint that returns past purchases with status and line item details.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Create order processing API
  - Files involved: `backend/src/*`

- [ ] **Add checkout validation and order preview**
  - Description: Add an endpoint that validates cart totals, taxes, and order data before final submission.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Add cart persistence and backend cart API
  - Files involved: `backend/src/*`

### Orders and Checkout Progress

Completed: 0  
Partial: 0  
Missing: 5

---

## Customer Account and Reviews

- [ ] **Add customer profile endpoints**
  - Description: Add backend profile read and update endpoints for customer name, email, phone, and saved preferences.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Add backend validation for auth DTOs
  - Files involved: `backend/src/*`

- [ ] **Add customer address CRUD endpoints**
  - Description: Add API support for customers to add, update, delete, and list saved shipping/pickup addresses.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Add customer profile endpoints
  - Files involved: `backend/prisma/schema.prisma`, `backend/src/*`

- [ ] **Add product review model and customer review API**
  - Description: Add a review model and endpoints to allow customers to leave reviews after purchase.
  - Priority: P2 Medium
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Add order processing API
  - Files involved: `backend/prisma/schema.prisma`, `backend/src/*`

- [ ] **Add purchase verification for reviews**
  - Description: Restrict review submission so only customers who purchased a product can leave a review.
  - Priority: P2 Medium
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Add product review model and customer review API
  - Files involved: `backend/src/*`

### Customer Account and Reviews Progress

Completed: 0  
Partial: 0  
Missing: 4

---

## Inventory and Promotions

- [ ] **Add stock validation on order creation**
  - Description: Prevent orders from being submitted when product stock is insufficient and update stock levels atomically.
  - Priority: P0 Critical
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Create order processing API
  - Files involved: `backend/prisma/schema.prisma`, `backend/src/*`

- [ ] **Add inventory history or audit records**
  - Description: Record inventory changes for stock adjustments and order fulfillment to support operational tracking.
  - Priority: P2 Medium
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Add stock validation on order creation
  - Files involved: `backend/prisma/schema.prisma`, `backend/src/*`

- [ ] **Add promotions support through coupons**
  - Description: Add coupon redemption endpoints and validate coupon type, value, minimum purchase, and expiry.
  - Priority: P2 Medium
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Create order processing API
  - Files involved: `backend/prisma/schema.prisma`, `backend/src/*`

### Inventory and Promotions Progress

Completed: 0  
Partial: 0  
Missing: 3

---

## Infrastructure and Database

- [ ] **Add backend Dockerfile**
  - Description: Add a production-ready backend container definition and integrate it into the existing `docker-compose.yml`.
  - Priority: P0 Critical
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `docker-compose.yml`, new `backend/Dockerfile`

- [ ] **Add admin and storefront Dockerfiles**
  - Description: Add build definitions for the admin and storefront apps so they can be deployed in containerized environments.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `admin/`, `storefront/`

- [ ] **Add database migration and schema review**
  - Description: Review the Prisma schema for production constraints, required fields, and add missing indexes for product search and orders.
  - Priority: P1 High
  - Estimated effort: 4h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/prisma/schema.prisma`, `backend/prisma/migrations/`

- [ ] **Add environment variable validation and startup checks**
  - Description: Validate required environment variables on launch and fail fast when configuration is missing or malformed.
  - Priority: P0 Critical
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/src/main.ts`, `backend/src/prisma/prisma.service.ts`, `backend/.env.example`

- [ ] **Add health and readiness endpoints**
  - Description: Add HTTP health and readiness endpoints for production monitoring and container orchestration.
  - Priority: P1 High
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Add environment variable validation and startup checks
  - Files involved: `backend/src/app.controller.ts`, `backend/src/app.module.ts`

- [ ] **Add MinIO integration in backend**
  - Description: Wire the existing MinIO service into backend storage support for product images and upload handling.
  - Priority: P2 Medium
  - Estimated effort: 5h
  - Current status: 🔴 Not Started
  - Dependencies: Add database migration and schema review
  - Files involved: `docker-compose.yml`, `backend/src/*`

### Infrastructure and Database Progress

Completed: 0  
Partial: 0  
Missing: 6

---

## Security

- [ ] **Add security headers and Fastify hardening**
  - Description: Add Helmet or an equivalent security middleware for Fastify to enforce secure HTTP headers.
  - Priority: P0 Critical
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/src/main.ts`

- [ ] **Add strict CORS allowlisting**
  - Description: Replace permissive CORS settings with a strict allowlist for admin and storefront domains.
  - Priority: P0 Critical
  - Estimated effort: 1h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/src/main.ts`

- [ ] **Add API rate limiting**
  - Description: Add request throttling to protect auth and checkout endpoints from abuse.
  - Priority: P1 High
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/src/main.ts`

- [ ] **Add secure session and cookie practices**
  - Description: If cookie-based auth is used, add secure, `HttpOnly`, `SameSite` cookie handling and CSRF protection.
  - Priority: P1 High
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Add security headers and Fastify hardening
  - Files involved: `backend/src/main.ts`, `backend/src/auth/*`

- [ ] **Audit secrets and remove hard-coded defaults**
  - Description: Remove inline default credentials and ensure all secrets are loaded from environment configuration only.
  - Priority: P0 Critical
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Add environment variable validation and startup checks
  - Files involved: `backend/src/auth/auth.module.ts`, `backend/src/auth/strategies/google.strategy.ts`, `backend/.env.example`

### Security Progress

Completed: 0  
Partial: 0  
Missing: 5

---

## Testing

- [ ] **Add backend integration tests for auth and user flows**
  - Description: Add Jest integration coverage for auth registration, login, refresh, and profile endpoints.
  - Priority: P1 High
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Add backend validation for auth DTOs
  - Files involved: `backend/test/*`, `backend/src/auth/*.spec.ts`

- [ ] **Add backend tests for product, cart, and order APIs**
  - Description: Add tests covering product listing, cart actions, checkout, and order lifecycle.
  - Priority: P1 High
  - Estimated effort: 8h
  - Current status: 🔴 Not Started
  - Dependencies: Create product catalog API, Create order processing API
  - Files involved: `backend/test/*`

- [ ] **Add end-to-end tests for admin login and order processing**
  - Description: Add e2e tests that exercise the admin login, order status update, and customer order tracking workflows.
  - Priority: P2 Medium
  - Estimated effort: 8h
  - Current status: 🔴 Not Started
  - Dependencies: Implement admin login and backend order APIs
  - Files involved: `backend/test/app.e2e-spec.ts`, new e2e files

- [ ] **Add storefront unit tests for key UI flows**
  - Description: Add tests for storefront product listing, cart interactions, and checkout components.
  - Priority: P2 Medium
  - Estimated effort: 6h
  - Current status: 🔴 Not Started
  - Dependencies: Implement storefront components
  - Files involved: `storefront/src/__tests__/*`

- [ ] **Add test coverage thresholds to CI**
  - Description: Add coverage minimums for backend and frontend tests to keep regressions visible.
  - Priority: P3 Low
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Add end-to-end tests for admin login and order processing
  - Files involved: `backend/package.json`, `storefront/package.json`, CI config once added

### Testing Progress

Completed: 0  
Partial: 0  
Missing: 5

---

## Documentation

- [ ] **Replace generic NestJS README with project-specific backend documentation**
  - Description: Replace the current starter README with instructions and architecture notes speciftaLnQ.
  - Priority: P2 Medium
  - Estimated effort: 2h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `backend/README.md`

- [ ] **Add admin README and setup notes**
  - Description: Add a README for the admin frontend describing the login flow, build commands, andtaonment variables.
  - Priority: P3 Low
  - Estimated effort: 1h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `admin/README.md`

- [ ] **Add storefront README and feature notes**
  - Description: Add a README for the customer storefront describing the app purpose, local developtaand deployment.
  - Priority: P3 Low
  - Estimated effort: 1h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `storefront/README.md`

- [ ] **Add architecture overview and backend module map**
  - Description: Document the high-level backend architecture, including auth, catalog, order, cart, and admin modules.
  - Priority: P2 Medium
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Independent
  - Files involved: `README.md` or `docs/architecture.md`

- [ ] **Add deployment runbook for production and Docker-based setup**
  - Description: Add a deployment checklist that covers environment setup, container builds, database migration, and rollback.
  - Priority: P2 Medium
  - Estimated effort: 3h
  - Current status: 🔴 Not Started
  - Dependencies: Add backend Dockerfile
  - Files involved: `README.md`, `docker-compose.yml`, `docs/deployment.md`

### Documentation Progress

Completed: 0  
Partial: 0  
Missing: 5

---

## Current Progress

Overall completion estimate: ~10% complete based on existing auth scaffold and schema, with the majority of customer-facing, admin, infrastructure, and security work still needed.

## Biggest Missing Features

- Customer storefront product browsing, cart, checkout, and order tracking.
- Admin product, category, order, and inventory management.
- Backend product, cart, and order APIs.
- Production-ready auth hardening and security middleware.
- Infrastructure containerization, environment validation, and deployment docs.

## Architecture Concerns

- The repository currently contains only auth and schema scaffolding; customer and admin workflows are not implemented.
- `storefront` is a placeholder Vue app, and `admin` is only a login guard / welcome page.
- Redis and MinIO are present in `docker-compose.yml` but unused in backend code.
- The Prisma schema includes models with no backend implementation, creating risk of drift.

## Security Concerns

- Passwords are hashed with raw SHA-256.
- JWT secret falls back to `dev-secret`.
- CORS is permissive and security headers are not configured.
- No rate limiting, CSRF protection, or environment validation exists.
- Hard-coded default credentials and OAuth dummy values are present.

## Technical Debt

- Generic NestJS starter README remains in `backend/README.md`.
- Existing DTOs are Swagger-only and lack actual validation.
- Auth logic stores refresh tokens in a minimal session model without cleanup.
- Admin UI components are present, but feature pages are not built.
- Storefront app is scaffold only and not wired to backend APIs.

## Suggested Next Tasks

- High impact
  - Create product module and API
  - Add cart persistence and backend cart API
  - Implement storefront catalog and product detail pages
  - Improve password storage security
  - Add backend Dockerfile and production Compose integration

- Lower impact
  - Add storefront README and admin README
  - Add architecture overview documentation
  - Add test coverage thresholds
  - Add product metadata/SEO fields
