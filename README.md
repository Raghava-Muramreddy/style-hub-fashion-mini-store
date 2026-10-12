# StyleHub – Fashion Mini Store

A full-stack fashion e-commerce application built with FastAPI, React, TypeScript, SQLite, and Stripe. The project demonstrates secure authentication, product browsing, cart management, checkout, and order tracking with Docker-based development.

> **Project status:** Development and learning project. Production readiness depends on verifying the implementation, security configuration, payment flow, and deployment environment.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
  - [Option 1: Docker Compose](#option-1-docker-compose)
  - [Option 2: Local Development](#option-2-local-development)
- [Application URLs](#application-urls)
- [API Documentation](#api-documentation)
- [Application Workflow](#application-workflow)
- [Database and Migrations](#database-and-migrations)
- [Stripe Test Payments](#stripe-test-payments)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)
- [License](#license)

## Features

- User registration and login with JWT authentication.
- Password hashing using bcrypt.
- Protected frontend routes and authenticated API endpoints.
- Fashion product catalog and product detail pages.
- Shopping cart with quantity management and price calculation.
- Checkout and order processing.
- Stripe PaymentIntent integration using Stripe Elements.
- Backend payment-status verification without webhooks.
- User-specific order history and order details.
- SQLite persistence through SQLAlchemy ORM.
- Alembic database migration support.
- Responsive React and TypeScript frontend.
- Dockerfiles and Docker Compose configuration.
- Environment-based application configuration.

Feature availability depends on the actual implementation in the repository.

## Technology Stack

| Layer | Technologies |
|---|---|
| Backend | Python 3.11+, FastAPI |
| ORM and migrations | SQLAlchemy 2.x, Alembic |
| Validation | Pydantic, pydantic-settings |
| Authentication | JWT, python-jose, bcrypt |
| Payment | Stripe Python SDK, Stripe.js, Stripe Elements |
| Frontend | React 18, Vite, TypeScript |
| Routing | React Router |
| Data fetching | TanStack Query |
| Database | SQLite |
| Containerization | Docker, Docker Compose |

## Project Structure

```text
stylehub/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── seed/
│   │   └── main.py
│   ├── alembic/
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── .env.example
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── prompt/
│   └── project.md
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .gitignore
├── Makefile
└── README.md
```

The structure above is representative. Refer to the actual repository for the complete directory listing.

## Prerequisites

For local development:

- Python 3.11 or later.
- Node.js 18 or a version supported by the project's Vite dependencies.
- npm.
- Git.

For containerized development:

- Docker Engine or Docker Desktop.
- Docker Compose v2.

A Stripe account with test-mode API keys is required to exercise real Stripe test payments.

## Environment Configuration

### 1. Root environment

Create a `.env` file in the project root using `.env.example` as the template.

```env
JWT_SECRET_KEY=replace-with-a-strong-random-secret
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

DATABASE_URL=sqlite:///./stylehub.db

STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
STRIPE_CURRENCY=inr

FRONTEND_URL=http://localhost:5173
BACKEND_CORS_ORIGINS=http://localhost:5173

VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

Use the exact variable names expected by the application's configuration.

### 2. Local development environment files

If the application loads separate environment files, create:

- `backend/.env` from `backend/.env.example`.
- `frontend/.env` using the Vite variables shown above.

Vite exposes variables prefixed with `VITE_` to browser code. Never place secret keys in these variables.

### Configuration requirements

- Replace placeholder values before running authentication or payment features.
- Generate a strong, random JWT signing secret.
- Use Stripe test-mode keys for development.
- Keep `.env` files out of version control.
- Do not commit real credentials or production secrets.
- Confirm that the database path resolves to a persistent location for your chosen execution mode.

## Getting Started

### Option 1: Docker Compose

This is the recommended starting point when the Docker configuration is complete.

**1. Configure environment variables**

Create the root `.env` file and configure the required values.

**2. Build and start the application**

```bash
docker-compose up --build
```

**3. Open the application**

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API documentation: http://localhost:8000/docs

**4. View application logs**

```bash
docker compose logs -f
```

To stop the application without removing persisted data:

```bash
docker compose down
```

To remove containers and named volumes:

```bash
docker compose down -v
```

**Warning:** The `-v` option removes named volumes and can permanently delete the SQLite database stored in those volumes. Back up important data before using it.

### Option 2: Local Development

Run the backend and frontend in separate terminals.

#### Step 1: Configure and start the backend

From the repository root, create a virtual environment.

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
```

If PowerShell blocks script activation, follow your organization's approved execution policy or use the virtual environment's Python executable directly.

**macOS/Linux**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

Configure `backend/.env` if required by the backend settings.

Start the API:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Keep this terminal running.

#### Step 2: Start the frontend

Open another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend should be available at http://localhost:5173.

Use the configured API base URL to connect the frontend to the backend.

#### Step 3: Verify the backend

Open:

- Health endpoint: http://localhost:8000/health
- Interactive API documentation: http://localhost:8000/docs
- Alternative API documentation: http://localhost:8000/redoc

The health endpoint is available only if it is implemented at the documented path.

### Option 3: Makefile

If the repository's Makefile defines these targets, run the commands from the project root:

```bash
make backend-install
make frontend-install
```

Start the backend:

```bash
make backend-run
```

Start the frontend in another terminal:

```bash
make frontend-run
```

Refer to the Makefile for the exact target definitions and supported operating systems.

## Application URLs

| Service | Local URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health check | http://localhost:8000/health |

These URLs assume the default ports and routes are configured as described.

## API Documentation

The API uses the `/api/v1` prefix for versioned application endpoints.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a user |
| POST | `/api/v1/auth/login` | Authenticate a user |
| GET | `/api/v1/users/me` | Retrieve the current user, if implemented |
| GET | `/api/v1/products` | Browse products |
| GET | `/api/v1/products/{product_id}` | Retrieve product details |
| GET | `/api/v1/cart` | Retrieve the authenticated user's cart |
| POST | `/api/v1/cart/items` | Add a cart item |
| PATCH | `/api/v1/cart/items/{item_id}` | Update item quantity |
| DELETE | `/api/v1/cart/items/{item_id}` | Remove a cart item |
| DELETE | `/api/v1/cart` | Clear the cart, if implemented |
| POST | `/api/v1/checkout` | Create an order and initiate checkout |
| GET | `/api/v1/payments/{payment_intent_id}/status` | Retrieve and verify payment status, if implemented |
| GET | `/api/v1/orders` | Retrieve the authenticated user's orders |
| GET | `/api/v1/orders/{order_id}` | Retrieve an order's details |

The actual route names may differ. Confirm the available endpoints in Swagger UI at `/docs` before integrating clients.

## Application Workflow

1. Browse the fashion catalog.
2. Register or log in.
3. Browse product details and add items to the cart.
4. Update quantities or remove items.
5. Proceed to checkout.
6. Let the backend validate the cart and calculate the payable amount.
7. Create a Stripe PaymentIntent.
8. Complete the payment through Stripe Elements.
9. Call the backend payment-status endpoint.
10. Let the backend retrieve and verify the PaymentIntent directly with Stripe.
11. Display payment success only after the backend confirms that the order is paid.
12. View order history and order details.

## Database and Migrations

StyleHub uses SQLite for development and SQLAlchemy ORM for database access.

Expected entities include:

- User
- Product
- Cart
- CartItem
- Order
- OrderItem

Alembic is intended to manage schema migrations.

If migrations are configured, run them from the backend directory:

```bash
alembic upgrade head
```

Generate a migration after changing SQLAlchemy models only when the project's migration workflow calls for it:

```bash
alembic revision --autogenerate -m "describe schema change"
```

Review generated migrations before applying them. Confirm the database URL and migration configuration before running commands.

Do not assume the database is automatically initialized or seeded. Follow the initialization process implemented in the repository.

For containerized development, confirm that the database file resides on a persistent mounted volume rather than only inside the container filesystem.

## Stripe Test Payments

StyleHub uses Stripe PaymentIntents and Stripe Elements for test payments.

### Payment flow

1. The backend creates the order and PaymentIntent.
2. The frontend confirms payment using Stripe.js.
3. The frontend calls the backend to retrieve the latest payment status.
4. The backend retrieves the PaymentIntent directly from Stripe.
5. The backend validates the payment amount, currency, order association, and ownership.
6. The backend marks the order as paid only after verifying a successful payment.
7. The frontend displays the final result returned by the backend.

On success the backend also decrements stock and empties the cart. On failure the order is marked `payment_failed` and the cart is kept.

Optional webhook: set `STRIPE_WEBHOOK_SECRET` and forward events with `stripe listen --forward-to localhost:8000/api/v1/payments/webhook` (handles `payment_intent.succeeded`, `payment_failed`, `canceled`).

Run backend tests with `cd backend; python -m pytest`.

### Webhook policy

**Stripe webhooks are intentionally not used in this project.**

The backend verifies payment status through direct Stripe API retrieval after frontend confirmation. A payment callback in the browser is not sufficient proof of payment.

Because there are no webhooks, delayed payment methods, interrupted browser sessions, and asynchronous payment outcomes require explicit retry or status-reconciliation handling. A payment must never be marked successful based on an unverified frontend result.

### Testing payments

- Use Stripe test-mode credentials only.
- Use Stripe's official test payment details for the selected test scenario.
- Never use real card details for testing.
- Never expose the Stripe secret key in the frontend.
- Do not store raw card numbers or security codes in the application database.

## Security

Before deploying to a public environment:

- Use strong secrets supplied through environment configuration or a secret manager.
- Validate JWT signatures, expiry, and claims.
- Hash passwords using the configured password-hashing library.
- Protect cart and order resources with authentication and ownership checks.
- Calculate product prices and order totals on the backend.
- Verify payment status directly with Stripe before updating order state.
- Implement idempotent payment and inventory transitions.
- Restrict CORS to approved frontend origins.
- Apply rate limiting to login, registration, and other sensitive endpoints.
- Avoid exposing internal errors or sensitive data in logs.
- Use HTTPS in public deployments.
- Configure database backups and a tested recovery process.
- Review dependencies and container images before release.

SQLite is suitable for local development and small demonstrations. Evaluate PostgreSQL or another production database if the deployment requires greater concurrent write throughput, horizontal scaling, or managed database operations.

## Troubleshooting

### Backend dependency installation fails

Confirm the Python version, virtual environment, and dependencies declared in `backend/pyproject.toml`.

### Frontend cannot connect to the API

Check `VITE_API_BASE_URL`, the backend's actual port, and the CORS configuration. Restart the Vite server after changing environment variables.

### Database changes are missing

Confirm `DATABASE_URL`, the active database file, and whether the required Alembic migrations have been applied.

### Stripe payment cannot be completed

Confirm that the publishable key and secret key belong to the same Stripe test account, the keys are test-mode keys, and the backend can reach Stripe.

### Docker data appears to disappear

Inspect the volume configuration in `docker-compose.yml`. Avoid `docker compose down -v` when you need to preserve persisted data.

### Port already in use

Stop the process using the required port or update the port mapping and corresponding frontend/backend configuration consistently.

## Useful Commands

| Task | Command |
|---|---|
| Start containers | `docker compose up --build` |
| Stop containers | `docker compose down` |
| View logs | `docker compose logs -f` |
| Install backend | `python -m pip install -e .` |
| Run backend | `uvicorn app.main:app --reload --port 8000` |
| Install frontend | `npm install` |
| Start frontend | `npm run dev` |
| Build frontend | `npm run build` |
| Apply migrations | `alembic upgrade head` |

Run backend commands from `backend/` and frontend commands from `frontend/`, unless your configuration specifies otherwise.

## License

No license has been specified in this README. Add a `LICENSE` file and update this section if the project is to be distributed publicly.

## Support

For setup and troubleshooting, consult the project configuration files, API documentation, and application logs. Verify all commands and environment variables against the current implementation before using the application in a public deployment.
