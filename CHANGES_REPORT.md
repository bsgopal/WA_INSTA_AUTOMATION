Summary of fixes applied
=======================

Files modified:
- backend/routes/auth.js: Make license activation not auto-login by default; support autoLogin flag; handle duplicate-key race; accept decoded role.
- backend/models/User.js: Added `AI` to role enum.
- backend/services/leadForwardingService.js: Attempt WAHA initialize if session disconnected; fallback to WhatsAppService on send failure; better logging.
- backend/services/MetaService.js: When sending media+buttons, split into media send + interactive button send to match provider capabilities.
- backend/routes/responseRules.js: Added stricter validation for `messageBlocks` during create; improved CSV parsing diagnostics.

Tests added:
- backend/tests/userModel.test.js: verifies `AI` role is accepted by `User` model.
- backend/tests/licenseModel.test.js: verifies license duplicate-key behavior and that license can be found after save.

How to run tests (from project root):

```bash
cd backend
npm install
npm test
```

Notes & next steps:
- If forwarding still fails in your environment, grab a recent server log around the Meta webhook event and share it.
- Consider adding `supertest`-based integration tests for the HTTP routes (requires refactoring `server.js` to export the `app`).
