# Library Management System — Architecture

## Overview

Full-stack library management application with a React/TypeScript frontend and a Spring Boot backend, connected to a MySQL database. Authentication is JWT-based with role-based access control.

```
Library-management-system/
├── library-frontend/          # React + TypeScript (Vite)
├── library-management-system/ # Spring Boot 3.5 (Java 17)
└── ARCHITECTURE.md
```

---

## Backend — `library-management-system/`

**Stack:** Java 17 · Spring Boot 3.5 · Spring Security · Spring Data JPA · MySQL · Lombok · JJWT 0.11.5

**Base package:** `com.example.library`  
**API base URL:** `http://localhost:8080/api/v1`  
**Database:** MySQL — `library_db` (auto-created, schema managed by Hibernate `ddl-auto=update`)

### Entry point

| File | Purpose |
|------|---------|
| `LibraryManagementSystemApplication.java` | Spring Boot main class |
| `src/main/resources/application.properties` | DB connection, Hibernate dialect, SQL logging |

---

### `model/` — JPA Entities

| File | Table | Fields |
|------|-------|--------|
| `Book.java` | `books` | id, title, author, isbn (unique), publicationYear, genre, totalCopies, availableCopies, createdAt, updatedAt |
| `Member.java` | `members` | id, firstName, lastName, email (unique), membershipDate, createdAt, updatedAt |
| `BorrowingRecord.java` | `borrowing_records` | id, member (FK), book (FK), borrowDate, dueDate, returnDate, status (BORROWED/RETURNED/OVERDUE), fineAmount, archived, archivedAt |
| `User.java` | `users` | id, email (unique), password (hashed), role — implements `UserDetails` |
| `Role.java` | — | Enum: `USER`, `ADMIN`, `LIBRARIAN` |

Both `Book` and `Member` use `@PrePersist` / `@PreUpdate` lifecycle hooks to auto-set audit timestamps.

---

### `repository/` — Data Access

| File | Purpose |
|------|---------|
| `BookRepository.java` | `JpaSpecificationExecutor<Book>` — supports dynamic filter queries |
| `BookSpecification.java` | Builds JPA `Specification` predicates for title / author / genre / available filters |
| `MemberRepository.java` | Custom JPQL query for name search (`firstName` or `lastName` containing term) |
| `BorrowingRecordRepository.java` | Queries for active/archived borrowings, member history, overdue counts |
| `UserRepository.java` | Find by email (used by Spring Security `UserDetailsService`) |

---

### `service/` — Business Logic

| File | Responsibilities |
|------|-----------------|
| `BookService.java` | CRUD, ISBN lookup, multi-field search via `BookSpecification`, copy count management on borrow/return |
| `MemberService.java` | CRUD, name search, duplicate email guard |
| `BorrowingService.java` | Borrow (validates availability + 5-book limit), return (calculates fine at 0.50/day overdue), archive old records, overdue status computation |
| `AnalyticsService.java` | Aggregates `BookStats`, `BorrowingStats`, and `MemberStats` into a single `LibraryAnalyticsDTO` |
| `AuthenticationService.java` | Register (admin-only), authenticate — issues JWT on success |

---

### `controller/` — REST Endpoints

#### `AuthenticationController` — `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/authenticate` | Public | Login — returns JWT |
| POST | `/register` | ADMIN | Create a new user account |

#### `BookController` — `/api/v1/books`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Any | Paginated list (sorted by title) |
| GET | `/{id}` | Any | Get by ID |
| GET | `/isbn/{isbn}` | Any | Get by ISBN |
| GET | `/search?title&author&genre&available` | Any | Multi-filter search |
| GET | `/{id}/availability` | Any | Availability info |
| POST | `/` | Any | Add book |
| PUT | `/{id}` | Any | Update book |
| DELETE | `/{id}` | ADMIN | Delete book |

#### `MemberController` — `/api/v1/members`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Any | Paginated list (sorted by lastName) |
| GET | `/{id}` | Any | Get by ID |
| GET | `/search?name` | Any | Search by first or last name |
| POST | `/` | Any | Add member |
| PUT | `/{id}` | Any | Update member |
| DELETE | `/{id}` | ADMIN | Delete member |

#### `BorrowingController` — `/api/v1/borrowings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Any | All borrowings paginated |
| GET | `/member/{memberId}` | Any | Member borrowing history |
| GET | `/member/{memberId}/active` | Any | Active borrowings for member |
| GET | `/archived` | Any | Archived records |
| POST | `/borrow?memberId&bookId` | Any | Borrow a book |
| POST | `/return/{recordId}` | Any | Return a book (calculates fine) |
| POST | `/archive?retentionDays` | ADMIN | Archive returned records older than N days |

#### `AnalyticsController` — `/api/v1/analytics`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Any | Returns `LibraryAnalyticsDTO` |

#### `UserController` — `/api/v1/users`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ADMIN | List all users (id, email, role) |
| DELETE | `/{id}` | ADMIN | Delete a user |

---

### `dto/` — Data Transfer Objects

| File | Used for |
|------|---------|
| `AuthenticationRequest.java` | Login payload (email, password) |
| `AuthenticationResponse.java` | Login response (JWT token) |
| `RegisterRequest.java` | Register payload (email, password, role) |
| `BookResponseDTO.java` | Book response (includes computed `borrowedCopies`) |
| `MemberResponseDTO.java` | Member response |
| `ReturnRecordResponseDTO.java` | Return response (includes fine amount) |
| `LibraryAnalyticsDTO.java` | Nested DTO: `BookStats`, `BorrowingStats`, `MemberStats` |
| `ArchiveResultDTO.java` | Archive operation result (count of archived records) |
| `ErrorResponse.java` | Standardised error payload |

---

### `security/`

| File | Purpose |
|------|---------|
| `SecurityConfiguration.java` | Filter chain — stateless sessions, CORS (ports 5173/5174), permits only `/auth/authenticate` publicly; enables method-level `@PreAuthorize` |
| `JwtAuthenticationFilter.java` | Extracts Bearer token from `Authorization` header, validates, and populates `SecurityContext` |
| `JwtService.java` | Generates and validates JWTs (JJWT); stores user email as subject |
| `ApplicationConfig.java` | `UserDetailsService` bean (load by email), `PasswordEncoder` (BCrypt), `AuthenticationProvider` |

---

### `exception/`

| File | Thrown when |
|------|------------|
| `ResourceNotFoundException.java` | Entity not found by ID |
| `ResourceAlreadyExistsException.java` | Duplicate email / ISBN |
| `BookNotAvailableException.java` | No copies available to borrow |
| `BookAlreadyReturnedException.java` | Attempting to return an already-returned record |
| `BorrowingLimitExceededException.java` | Member has reached the 5-book borrow limit |
| `InventoryStateException.java` | Copy counts would go negative |
| `GlobalExceptionHandler.java` | `@RestControllerAdvice` — maps all exceptions above to structured `ErrorResponse` JSON |

---

## Frontend — `library-frontend/`

**Stack:** React 18 · TypeScript · Vite · Axios · React Router v6 · Lucide React

**Dev server:** `http://localhost:5173`

### Entry points

| File | Purpose |
|------|---------|
| `index.html` | Vite HTML shell |
| `src/main.tsx` | React root — mounts `<App />` |
| `src/App.tsx` | Router setup, route definitions, `MainLayout` wrapper |
| `src/index.css` | Global CSS variables (colors, spacing, radii, shadows, fonts) |
| `src/App.css` | Legacy Vite scaffold styles (unused in app UI) |

---

### `src/services/`

| File | Purpose |
|------|---------|
| `api.ts` | Axios instance (`baseURL: /api/v1`) with Bearer token interceptor; exports `authApi`, `bookApi`, `memberApi`, `borrowingApi`, `userApi`, `analyticsApi` |

---

### `src/context/`

| File | Purpose |
|------|---------|
| `AuthContext.tsx` | `AuthProvider` — stores JWT + decoded role in state; exposes `login()`, `logout()`, `isAuthenticated`, `role` via `useAuth()` hook |

---

### `src/components/`

#### `auth/`
| File | Purpose |
|------|---------|
| `ProtectedRoute.tsx` | Redirects to `/login` if not authenticated |
| `RoleProtectedRoute.tsx` | Redirects to `/unauthorized` if role is not ADMIN or LIBRARIAN (configurable via `roles` prop) |

#### `layout/`
| File | Purpose |
|------|---------|
| `Navbar.tsx` | Top navigation bar — shows links based on role, logout button |
| `Navbar.css` | Navbar styles |

---

### `src/pages/`

#### Auth pages — `pages/auth/`
| File | Route | Purpose |
|------|-------|---------|
| `LoginPage.tsx` | `/login` | Email/password form — calls `authApi.login()`, stores token, redirects |
| `RegisterPage.tsx` | — | Unused / scaffolded (registration handled by admin via Users panel) |
| `UnauthorizedPage.tsx` | `/unauthorized` | Shown when a USER role tries to access a management route |
| `Auth.css` | — | Shared styles for auth pages |

#### Main pages
| File | Route | Role | What's implemented |
|------|-------|------|--------------------|
| `Dashboard.tsx` | `/` | ADMIN, LIBRARIAN | Stat cards wired to `GET /analytics` (totalTitles, activeMembers, activeBorrowings, overdueBorrowings); loading skeleton (`—`) and error state |
| `Dashboard.css` | — | — | Stat card grid, page header styles |
| `Books.tsx` | `/books` | ADMIN, LIBRARIAN | Paginated book table; live filter bar (title + author + genre + availability dropdown) with 350ms debounce; add/edit modal; admin-only delete with confirm step; CRUD refresh via `version` counter |
| `Books.css` | — | — | Table, filter bar, modal, pagination, status badge styles |
| `Members.tsx` | `/members` | ADMIN, LIBRARIAN | Paginated member table; live name search with inline clear button (350ms debounce); add/edit modal; admin-only delete with confirm step |
| `Members.css` | — | — | Member-specific cell styles (shared table/modal styles come from Books.css globals) |
| `Borrowings.tsx` | `/borrowings` | ADMIN, LIBRARIAN | Paginated borrowing records; borrow form (member ID + book ID); return action; status badges (BORROWED / RETURNED / OVERDUE) |
| `Borrowings.css` | — | — | Borrowing page styles |
| `Users.tsx` | `/users` | ADMIN only | User management panel — list all users with role badges; create user (email + password + role); delete user |
| `Users.css` | — | — | User management styles |

---

## Route Summary

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | `LoginPage` | Public |
| `/unauthorized` | `UnauthorizedPage` | Authenticated |
| `/` | `Dashboard` | ADMIN, LIBRARIAN |
| `/books` | `Books` | ADMIN, LIBRARIAN |
| `/members` | `Members` | ADMIN, LIBRARIAN |
| `/borrowings` | `Borrowings` | ADMIN, LIBRARIAN |
| `/users` | `Users` | ADMIN only |
| `*` | Redirect → `/` | — |

---

## What Has Been Implemented

### Authentication & Security
- JWT authentication (login issues token, all protected routes require `Authorization: Bearer <token>`)
- Three roles: `ADMIN`, `LIBRARIAN`, `USER`
- Frontend route guards: `ProtectedRoute` (any authenticated user) and `RoleProtectedRoute` (ADMIN or LIBRARIAN)
- Admin-only actions: delete book, delete member, delete user, register user, archive borrowings
- Backend `@PreAuthorize` method-level enforcement mirrors frontend role gates

### Books
- Full CRUD (create, read, update, delete)
- Multi-field search: title, author, genre, availability — powered by JPA `Specification`
- Frontend: live filter bar with 350ms debounce, clear button, pagination

### Members
- Full CRUD
- Name search (first or last name)
- Frontend: live search with inline clear button, pagination

### Borrowings
- Borrow a book (validates copy availability, enforces 5-book-per-member limit)
- Return a book (auto-calculates overdue fine at $0.50/day)
- View all borrowings and per-member history
- Active borrowings lookup
- Admin archive operation (soft-archives returned records older than N days)

### Users
- Admin panel to list, create (via `/auth/register`), and delete system users
- Role assignment at creation (ADMIN / LIBRARIAN / USER)

### Dashboard Analytics
- Single `GET /analytics` endpoint aggregates live stats from the database
- Frontend stat cards display: total book titles, active members, active borrowings, overdue returns
- Loading and error states handled

### Error Handling
- Backend: `GlobalExceptionHandler` converts all domain exceptions to structured JSON with HTTP status codes
- Frontend: API errors surface inline (form errors in modals, error banners on page level)
