# 📚 Enterprise Full-Stack Library Management System

[![Java](https://img.shields.io/badge/Java-21-orange.svg?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.x-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![Spring Security](https://img.shields.io/badge/Spring%20Security-6.x-green.svg?logo=springsecurity)](https://spring.io/projects/spring-security)
[![React](https://img.shields.io/badge/React-19-blue.svg?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg?logo=mysql)](https://www.mysql.com/)
[![Flyway](https://img.shields.io/badge/Flyway-Migrations-red.svg?logo=flyway)](https://flywaydb.org/)
[![Tests](https://img.shields.io/badge/Tests-63%20Passing-success.svg)](https://github.com/)

A modern, production-grade, enterprise full-stack Library Management System engineered to solve high-concurrency inventory reservation conflicts, enforce multi-tenant role-based access control (RBAC), and automate daily operations through background batch scheduling.

Built with a **Spring Boot 3 (Java 21)** REST backend and a reactive, accessible **React 19 (Vite + Tailwind CSS v4)** Single Page Application.

---

## 📑 Table of Contents
- [Architecture Overview](#-architecture-overview)
- [Key Business Engines & Features](#-key-business-engines--features)
- [Tech Stack](#-tech-stack)
- [Database Governance & Migrations](#-database-governance--migrations)
- [Frontend Architecture & Reliability](#-frontend-architecture--reliability)
- [Project Structure](#-project-structure)
- [Local Development & Setup](#-local-development--setup)
- [Automated Testing & Build Verification](#-automated-testing--build-verification)
- [API Endpoints Overview](#-api-endpoints-overview)

---

## 🏛 Architecture Overview

The system follows a clean **3-Tier Enterprise Architecture** adhering to separation of concerns, DTO isolation, and transactional integrity.

```
Client Tier (React 19 + Vite)
 │  Axios Interceptors (Bearer JWT, Auto 401/403 Catch, Error Boundaries)
 ▼
Security Tier (Spring Security 6)
 │  JwtAuthenticationFilter (OncePerRequestFilter) ➔ Method-Level RBAC (@PreAuthorize)
 ▼
API / Controller Tier
 │  REST Controllers with Jakarta Bean Validation (@Valid, @NotBlank, @Min)
 ▼
Service / Business Tier
 │  @Transactional (Isolation.READ_COMMITTED)
 │  FIFO Waitlist Engine | 48h Quarantine Lock | @Scheduled Batch Sweepers
 ▼
Persistence Tier (Spring Data JPA / Hibernate)
 │  spring.jpa.hibernate.ddl-auto=validate (Zero schema drift)
 ▼
Database Tier (MySQL 8)
    Flyway Versioned Migrations (V1 ➔ V4) + Composite Indexes & Check Constraints
```

---

## ⚡ Key Business Engines & Features

### 1. 🔒 Security & Method-Level RBAC
- **Stateless JWT Authentication:** HMAC-SHA256 tokens carrying username and role claims with BCrypt (strength 12) password hashing.
- **Method-Level Security:** Protected via `@PreAuthorize("hasRole('ADMIN')")` and `@PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMIN')")`.
- **Mass-Assignment Defense:** Full decoupling of incoming request payloads (`BookRequestDTO`, `BorrowRequestDTO`) from internal JPA entities. Passwords and internal state are completely hidden from outgoing responses via Jackson `@JsonIgnore` / mapper layers.

### 2. ⏳ The 48-Hour Quarantine Lock & FIFO Waitlist
- When all copies of a book are checked out, patrons can join a timestamped **FIFO reservation queue** (`PENDING`).
- When a book is returned:
  - If a reservation exists, **`available_copies` is NOT released to general circulation**.
  - The oldest `PENDING` hold transitions to **`HELD_FOR_PICKUP`** with an atomic **48-hour quarantine deadline** (`pickupDeadline = Instant.now() + 48 Hours`).
  - Only that specific reserved patron is authorized to check out the quarantined copy.
- If borrowed within 48 hours, the status transitions to **`FULFILLED`**.

### 3. ⏰ Automated Background Batch Processing (`@Scheduled`)
- **Daily Overdue Sweeper (`0 0 1 * * ?` at 01:00 AM):** Queries all active borrowings where `due_date < today`, flags them as `OVERDUE`, and computes daily overdue fines. Calculations are strictly **idempotent**, preventing accidental duplicate billing.
- **Reservation Expiration Sweeper:** Automatically sweeps stale `HELD_FOR_PICKUP` records whose `pickupDeadline < now()`. Transitions expired records to `EXPIRED` and either promotes the next waiting patron in line (granting a fresh 48-hour window) or safely increments `available_copies++` back to general circulation.

### 4. 💵 Fine Ledger & Payment Management
- Automated fine generation for overdue returns ($0.50 per day).
- Tracks fine statuses (`UNPAID`, `PAID`, `WAIVED`).
- Role-restricted fine waivers accessible exclusively to authorized librarians/admins.

---

## 🛠 Tech Stack

### Backend
| Technology | Description |
|---|---|
| **Java 21** | Modern LTS Java runtime utilizing pattern matching and modern records |
| **Spring Boot 3.4.x** | Core application framework, auto-configuration, dependency injection |
| **Spring Security 6** | Stateless authentication filter chain and method-level access control |
| **Spring Data JPA** | Data abstraction layer powered by Hibernate ORM |
| **MySQL 8.0** | Relational data store |
| **Flyway** | Version-controlled database schema migrations (`V1`–`V4`) |
| **Jakarta Validation** | Declarative DTO validation constraints (`@Valid`, `@NotBlank`, `@Min`) |
| **JUnit 5 & Mockito** | Comprehensive unit and MockMvc integration testing suite |

### Frontend
| Technology | Description |
|---|---|
| **React 19** | Modern UI library with component composition and React hooks |
| **Vite 6** | Next-generation frontend build tooling and dev server |
| **Tailwind CSS v4** | Modern utility-first CSS styling system |
| **Axios** | HTTP client featuring centralized request/response interceptors |
| **React Router v7** | Declarative client-side routing and protected route guards |
| **Lucide Icons** | Clean, accessible iconography |

---

## 🗄 Database Governance & Migrations

Database mutations are governed strictly through **Flyway versioned migrations**. Hibernate is locked with `spring.jpa.hibernate.ddl-auto=validate`, guaranteeing zero manual schema drift.

```
src/main/resources/db/migration/
├── V1__init_schema.sql                  # Core users, roles, books, borrowing records
├── V2__add_fines.sql                     # Fines table and payment status constraints
├── V3__add_reservations.sql              # FIFO reservation queue, quarantine lock & pickup deadlines
└── V4__add_indexes_and_constraints.sql   # CHECK (available_copies >= 0) & composite B-Tree indexes
```

### Key Performance Indexes:
- `idx_borrowing_status_due` on `borrowing_records(status, due_date)`: Accelerates daily overdue sweeps.
- `idx_reservations_book_status` on `reservations(book_id, status)`: Ensures sub-millisecond waitlist queries.

---

## 💻 Frontend Architecture & Reliability

- **Centralized Axios Interceptors:**
  - Injects `Authorization: Bearer <token>` on all outbound HTTP calls.
  - Catches `401 Unauthorized` responses globally, flushes stale auth tokens, and navigates seamlessly to login.
  - Catches `403 Forbidden` responses and routes to a custom unauthorized access screen.
- **Declarative Error Boundaries:** Top-level class-based `ErrorBoundary` prevents uncaught child component exceptions from crashing the application.
- **Role-Based Protected Routes:** `<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_LIBRARIAN']}>` guards administrative portals against unauthenticated or unauthorized patrons.
- **Accessibility (WCAG 2.1 AA):** Built with semantic HTML elements (`<main>`, `<nav>`, `<header>`), explicit `aria-label` tags, focus-visible indicators, and high-contrast color tokens.

---

## 📂 Project Structure

```
Library-management-system/
├── library-management-system/          # Spring Boot Backend
│   ├── src/main/java/com/example/library/
│   │   ├── config/                     # SecurityConfig, WebConfig, OpenApiConfig
│   │   ├── controller/                 # REST Controllers (Auth, Books, Borrowings, Fines, Reservations, Analytics)
│   │   ├── dto/                        # Request & Response DTOs
│   │   ├── exception/                  # GlobalExceptionHandler (@RestControllerAdvice)
│   │   ├── model/                      # JPA Entities (User, Role, Book, BorrowingRecord, Fine, Reservation)
│   │   ├── repository/                 # Spring Data JPA Repositories
│   │   ├── scheduler/                  # OverdueSweeper & ReservationExpirySweeper (@Scheduled)
│   │   ├── security/                   # JwtService, JwtAuthenticationFilter, CustomUserDetailsService
│   │   └── service/                    # Business Service Implementations
│   ├── src/main/resources/
│   │   ├── application.properties      # Backend configuration
│   │   └── db/migration/               # Flyway SQL Migration Scripts (V1 - V4)
│   └── src/test/java/                  # 63 Unit & MockMvc Integration Tests
│
└── library-frontend/                   # React 19 Frontend
    ├── src/
    │   ├── api/                        # Axios instance and centralized API modules
    │   ├── components/                 # Reusable UI components, Modals, ErrorBoundary, Navbar
    │   ├── context/                    # AuthContext and useAuth Hook
    │   ├── pages/                      # Catalog, Borrowings, MemberPortal, AdminDashboard, Login, Register
    │   └── routes/                     # ProtectedRoute and Application Route Definitions
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Local Development & Setup

### Prerequisites
- **Java 21** JDK installed
- **Node.js 18+** & npm installed
- **MySQL 8.0+** running locally

### 1. Database Setup
Create the MySQL database:
```sql
CREATE DATABASE library_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup (Spring Boot)
1. Navigate to the backend directory:
   ```bash
   cd library-management-system
   ```
2. Configure database credentials in `src/main/resources/application.properties` (or set environment variables):
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/library_db?useSSL=false&serverTimezone=UTC
   spring.datasource.username=your_mysql_username
   spring.datasource.password=your_mysql_password
   spring.jpa.hibernate.ddl-auto=validate
   ```
3. Run the application (Flyway will automatically execute migrations `V1` through `V4`):
   ```bash
   ./mvnw clean spring-boot:run
   ```
   *The backend will start at `http://localhost:8080`.*

### 3. Frontend Setup (React 19)
1. Navigate to the frontend directory:
   ```bash
   cd ../library-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`.*

---

## 🧪 Automated Testing & Build Verification

### Backend Tests (JUnit 5, Mockito, MockMvc)
The backend test suite contains **63 automated tests** covering unit business logic, JPA repository query methods, and MockMvc integration tests verifying security authorization filters:
```bash
cd library-management-system
./mvnw test
```

### Frontend Production Build Verification
The React frontend builds cleanly with zero errors and zero warnings:
```bash
cd library-frontend
npm run build
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new member account |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT |
| `GET` | `/api/books` | Public / Member | Browse book catalog with search & pagination |
| `POST` | `/api/books` | Admin / Librarian | Add new book to inventory |
| `PUT` | `/api/books/{id}` | Admin / Librarian | Update book metadata and copy counts |
| `DELETE` | `/api/books/{id}` | Admin | Soft-delete / remove book from catalog |
| `POST` | `/api/borrowings/borrow` | Member / Staff | Checkout available book copy |
| `POST` | `/api/borrowings/return/{id}` | Member / Staff | Process book return & trigger quarantine check |
| `POST` | `/api/reservations/reserve` | Member | Place a hold on unavailable book |
| `GET` | `/api/reservations/my-holds` | Member | View personal active reservations & waitlist positions |
| `GET` | `/api/fines/my-fines` | Member | View unpaid/paid fine ledger |
| `POST` | `/api/fines/{id}/waive` | Admin / Librarian | Waive patron fine |
| `GET` | `/api/analytics/dashboard` | Admin / Librarian | System-wide circulation & revenue statistics |

---

## 📄 License
This project is licensed under the MIT License.
