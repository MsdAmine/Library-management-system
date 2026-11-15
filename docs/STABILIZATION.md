# Stabilization acceptance checks

Use disposable accounts and books in a development database. Record the browser, role,
steps, expected behavior, and any console/network error for a failed check.

- Admin: log in, create a member, search/edit the catalog, and inspect member fines.
  Restart the backend and verify the admin password still works.
- Librarian: log in, manage loans and waive a pending fine; account creation is unavailable.
- Member: log in, search the catalog, borrow an available book, and inspect active loans/history.
  Reload the page and verify the session and role persist.
- Borrow all copies, join the reservation queue, return a copy as staff, and verify pickup allocation.
  Fulfill pickup and verify a new loan appears without decrementing public inventory twice.
- Cancel pickup and check transfer to the next patron, or restoration of public availability.
- Verify overdue loans remain visible and count toward the five-loan limit.
- Return an overdue loan; verify one fine at 1.50/day. Pay it as its owner, or waive it as staff.
- Check empty catalog/member/history states and loading indicators on a slow network.
- Stop the API temporarily; verify affected pages show a recoverable error.
- Expire a token or receive a 401; verify logout and login navigation. A borrowing-limit 403
  should show its message while preserving the current session and page.
- Open staff URLs as a member; verify route guards. Direct API calls must enforce the same permissions.

Automated integration tests cover database locking, ownership, expiry, and loan limits.
These manual checks complement those tests; they are not evidence that a browser pass has occurred.
