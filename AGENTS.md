# Repository Guidelines

## Project Structure & Module Organization

- `library-management-system/` contains the Spring Boot backend; `pom.xml` targets Java 17. Application code lives in `src/main/java/com/example/library/`, organized into `controller`, `service`, `repository`, `model`, `dto`, `security`, `scheduler`, `config`, and `exception` packages.
- Backend configuration and Flyway migrations live in `src/main/resources/`; tests mirror application packages under `src/test/java/`.
- `library-frontend/` contains React 19, Vite 8, and mixed JavaScript/TypeScript sources. Use `src/pages/` for feature screens, `components/` for shared UI, `api/` for Axios services, and `context/` and `routes/` for authentication and navigation. Assets live in `src/assets/` and `public/`.

## Build, Test, and Development Commands

Run commands from the corresponding module directory; there is no root build script.

Backend (`cd library-management-system`), using PowerShell:

- `.\mvnw.cmd spring-boot:run`: start the API on port 8080.
- `.\mvnw.cmd test`: run backend tests.
- `.\mvnw.cmd clean package`: test and package the application into `target/`.

On Unix, use `./mvnw` instead.

Frontend (`cd library-frontend`):

- `npm ci`: install locked dependencies.
- `npm run dev`: start the Vite development server.
- `npm run build`: run TypeScript project checks and create `dist/`.
- `npm run lint`: run ESLint; the current configuration targets TypeScript/TSX files.
- `npm run preview`: serve the production build locally.

## Coding Style & Naming Conventions

Use four-space indentation in Java and two spaces in frontend code, preserving surrounding formatting. Use PascalCase for Java classes and React components, camelCase for methods and variables, and descriptive suffixes such as `BookService`, `BookRequestDTO`, and `bookService.js`. Keep business rules in services and HTTP calls in frontend API modules. No dedicated formatter is configured.

## Testing Guidelines

Use JUnit 5, Mockito, AssertJ, and MockMvc. Name classes `*Test` and methods descriptively, following `addBook_NewBook_SavesSuccessfully`. Cover business-rule failures and authorization changes. The context-loading test requires a configured MySQL instance. No coverage threshold or frontend test runner is configured; validate frontend changes with lint, build, and manual checks of affected flows.

## Commit & Pull Request Guidelines

Follow Git history: `feat(api): ...`, `fix(layout): ...`, or `refactor(dashboard): ...`. Keep commits focused. PRs should describe behavior changes, link related issues, report validation results, and include screenshots for UI changes.

## Security & Configuration

Override database credentials through `SPRING_DATASOURCE_*` environment variables. Set frontend `VITE_API_BASE_URL` in an ignored local environment file. Keep secrets out of commits. Preserve Hibernate schema validation and add schema changes as new `V<number>__description.sql` Flyway migrations.
