# Application Test Report ? 2026-11-16

## Environment and scope

Tested with headless desktop Chrome at 1440 ? 1000 and a 390 ? 844 mobile viewport.
The browser used a separate Vite instance on port 5174, an API on port 8081, and a
disposable MySQL 8 container. Existing services on ports 5173/8080 and development
records were left in place. Generated accounts and transaction dates were test fixtures.

## Results

- 26 scripted browser workflow checks passed after the fixes below. These included
  repeated dashboard/ledger consistency checks; this is not a coverage percentage.
- Invalid credentials and the initial dashboard, catalog, directory, circulation,
  and analytics empty states were also inspected.
- No uncaught browser JavaScript exceptions occurred in the final workflow runs.
- Backend Maven verification: 80 tests, no failures or errors.
- Frontend Vitest: 9 tests passed. ESLint and production build passed.
- The production build still emits its existing bundle-size warning.

## Browser workflows exercised

| Area | Checks |
| --- | --- |
| Accounts | Admin member creation and profile editing; login for ADMIN, LIBRARIAN, and USER; logout; session rejection; deactivation invalidating an old token |
| Permissions | Member route guards and direct staff API requests; librarian controls; cross-member fine-payment rejection |
| Catalog | Creation, title search, metadata edit, stock updates, completed-history deletion, and rejection of deletion while a loan remains outstanding |
| Circulation | Staff checkout, member active-loan display after reload, on-time return, overdue sweep, overdue return, and exact fine amount |
| Reservations | Queue placement, cancellation, return allocation, member pickup claim, and retained inventory consistency |
| Fines and reports | Member ledger settlement, librarian waiver, pending-count accuracy, and exclusion of waived amounts from collected revenue |
| Reliability | Unreachable API error and recovery, archived history, mobile dashboard navigation, and desktop screenshots |

## Issues found and fixed

1. **Loan lists failed with HTTP 500 after checkout.** Entity responses exposed
   Hibernate proxies, leaving the staff list and member portal empty. Explicit loan
   response DTOs now preserve the frontend fields without serializing entities.
   Regression tests run with Open Session in View disabled.
2. **Members could call the analytics API directly.** Added staff authorization to
   match the UI restriction, with an API regression assertion.
3. **Settled fines appeared as pending.** A paid and a waived fine produced a dashboard
   count of two instead of zero. The dashboard now counts only PENDING ledger records,
   including explicitly displaying zero. Three component cases cover this calculation.
4. **Waived fines inflated collected revenue.** The test ledger contained 4.50 paid and
   1.50 waived; analytics reported 6.00. Revenue now sums PAID fine records and reports
   4.50. Integration tests distinguish pending, waived, and paid amounts.
5. **Deleting a checked-out book broke its later return.** Deletion now acquires the
   circulation lock and returns HTTP 409 while loans or active holds remain. The UI
   displays the reason. A regression checks loan, pickup-hold, and resolved states.

## Remaining follow-up

- **Payment presentation:** the member modal presents card, wallet, bank, and verified
  processing claims, but it only updates the library ledger and generates a reference.
  Label it clearly as a simulation or implement and verify an actual payment provider
  before offering real online payment. No real payment was attempted.
- **Accessibility:** an axe scan of the five admin routes found contrast failures on
  dashboard/analytics text and unnamed select controls in catalog, members, and loans.
  Non-empty forms need an additional accessibility pass; this scan was not exhaustive.
- **Error clarity:** a failed catalog request displays both a network error and an empty
  library message. Show the empty state only after a successful empty response.

## Evidence and limitations

Diagnostic JSON, screenshots, and the Maven verification log were generated under
`library-management-system/target/browser-check/` (ignored build artifacts). These
include `full-results.json`, `followup-results.json`, `edge-results.json`, and
`accessibility.json`. A clean build may remove them.

This pass did not cover every input combination, other browser engines, production
hosting, load testing, or real financial transactions. Existing automated integration
tests additionally exercise simultaneous checkout/return, expiry races, and loan limits.
The temporary browser environment was removed after verification. No commit or push
was performed for these fixes.
