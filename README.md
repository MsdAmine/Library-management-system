# Library Management System

A React 19 / Vite 8 frontend and Spring Boot 3.5 backend for catalog management,
members, borrowing, FIFO reservations, fines, and analytics.

## Requirements

- JDK 17 (the Maven target), Node.js 22.12+ and npm.
- MySQL 8 for development.
- Docker running for backend integration tests; tests create disposable MySQL containers.

## Structure

- `library-management-system/src/main/java/com/example/library/`: controllers, DTOs,
  services, repositories, models, security, and scheduled jobs.
- `library-management-system/src/main/resources/db/migration/`: Flyway migrations.
- `library-management-system/src/test/`: unit and MySQL integration tests.
- `library-frontend/src/`: pages, shared components, Axios API modules, routes, and auth context.

## Start locally (PowerShell)

Run the two modules in separate terminals. Configure credentials for your own local database:

```powershell
cd library-management-system
$env:SPRING_DATASOURCE_URL = 'jdbc:mysql://localhost:3306/library_db?createDatabaseIfNotExist=true'
$env:SPRING_DATASOURCE_USERNAME = 'your-user'
$env:SPRING_DATASOURCE_PASSWORD = 'your-password'
# Set a private Base64-encoded signing key containing at least 32 random bytes.
$env:APPLICATION_SECURITY_JWT_SECRET_KEY = 'your-base64-signing-key'
.\mvnw.cmd spring-boot:run
```

For persistent local settings, create `library-management-system/application-local.properties`
(ignored by Git). It is loaded automatically when running from the backend directory.
Set `application.security.jwt.secret-key` to your private Base64 signing key there;
this replaces the need to export the key in every terminal. Never commit the local file.

The API runs on port 8080. Generate a signing key once and keep it private; do not change it
on each restart unless you intend to invalidate existing sessions.

To create the first administrator, explicitly set `APP_BOOTSTRAP_ENABLED=true`,
`APP_BOOTSTRAP_EMAIL`, and `APP_BOOTSTRAP_PASSWORD` before the first startup.
Disable bootstrap afterward. Existing accounts are never reset by bootstrap and passwords
are never logged. Account creation through the API is restricted to administrators.

```powershell
cd library-frontend
npm ci
# Optional: defaults to http://localhost:8080/api/v1
$env:VITE_API_BASE_URL = 'http://localhost:8080/api/v1'
npm run dev
```

Vite normally serves port 5173. Backend CORS allows localhost ports 5173 and 5174.
Use an ignored frontend `.env.local` for persistent local frontend configuration.

## Borrow as a member

Sign in with a member account (`USER` role), then open **Catalog**:

1. For an available title, select **Borrow Book** in table or card view.
2. Review the title and select **Confirm Borrow**. This creates a loan immediately;
   cancelling creates no loan.
3. Check the confirmation for your due date, or open your member portal to see the
   new loan. The borrowing period is 14 days.

Unavailable titles retain **Reserve / Hold**. When your reserved copy is ready,
use **Ready for Pickup - Claim Book**. Staff can still issue loans through
**Circulation & Loans → New Loan Checkout**.

## Business rules

- Five outstanding loans per member; both BORROWED and OVERDUE count.
- Loans last 14 days; overdue returns incur 1.50 per day.
- Unpaid (PENDING) fines exceeding 10.00 block checkout; exactly 10.00 does not.
- Reservations are allowed when no public copies are available. Returns allocate a copy
  to the oldest pending reservation, ordered by reservation time then ID.
- Pickup lasts 48 hours. Expired holds cannot be checked out before the expiry sweep.
- Cancelling or expiring a held reservation transfers the copy to the next patron or public stock.
- Members pay their own fines; administrators and librarians can record payments and waive fines.
  Payment records are internal ledger entries; no payment gateway is integrated.

## API and authorization

All routes use `/api/v1`. Authentication is `POST /auth/authenticate`.
`POST /auth/register` and `POST /members` require ADMIN. There is no public signup.
Authenticated users can browse `/books`, manage their own `/reservations/my-holds`,
view `/fines/my-fines`, and access their own borrowing history.
Staff manage returns, the member directory, queues, fines, and analytics.
Admins additionally control member deletion and loan archives.
Reservation fulfillment creates a loan through the same checkout rules as ordinary borrowing.

## Schema and scheduled jobs

Hibernate validates the schema; Flyway performs schema changes. Never edit applied migrations:
add `V<number>__description.sql` instead.

Existing migrations: `V1__init_schema.sql`, `V2__add_performance_indexes.sql`,
`V3__create_fine_table.sql`, `V4__add_reservation_pickup_fields.sql`, and
`V5__make_legacy_borrowing_member_optional.sql`. V5 preserves historical
`member_id` values in older databases while allowing new loans to use `user_id`;
fresh databases do not need this compatibility change. Restart the backend to
apply pending migrations automatically.
The overdue sweep runs daily at 01:00; pickup expiry runs every 15 minutes,
using the application's system timezone. `APP_SCHEDULER_ENABLED=false` disables scheduling.

## Verification

```powershell
cd library-management-system
.\mvnw.cmd verify
# In library-frontend:
npm test
npm run lint
npm run build
```

Backend tests use disposable MySQL databases, disable bootstrap and scheduled execution,
and never target the development database. Docker must be running.
Frontend tests use Vitest, jsdom, and React Testing Library. ESLint currently targets TS/TSX;
JavaScript is exercised by tests and the production build. GitHub Actions runs both suites.
The current production bundle emits a size warning; optimization is deferred.
See [manual verification](docs/STABILIZATION.md) for UI acceptance checks.
