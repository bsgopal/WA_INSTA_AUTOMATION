# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Manual and Imported Customers Missing optedIn.whatsapp
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that manually created customers (POST /customers) have `optedIn.whatsapp: true` in database
  - Test that CSV-imported customers (POST /customers/import/csv) have `optedIn.whatsapp: true` in database
  - Test that these customers are included in campaign filter results (`appendWhatsAppOptInQuery`)
  - **Bug Condition**: `isBugCondition(customerCreationInput)` returns true when:
    - `customerCreationInput.endpoint IN ['POST /customers', 'POST /customers/import/csv']`
    - AND `customerCreationInput.customerData.optedIn IS undefined OR customerCreationInput.customerData.optedIn.whatsapp IS undefined`
  - **Expected Behavior**: All customers created via manual creation or CSV import should have `optedIn.whatsapp: true` and be included in WhatsApp campaign queries
  - Run test on UNFIXED code in `backend/routes/customers.js`
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Manually created customer missing `optedIn.whatsapp` field
    - CSV-imported customers missing `optedIn.whatsapp` field
    - Campaign filters excluding these customers
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Webhook and Update Operations Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Webhook-created WhatsApp customers have `optedIn: { whatsapp: true, instagram: false }`
    - Webhook-created Instagram customers have `optedIn: { whatsapp: false, instagram: true }`
    - Customer updates (PUT /customers/:id) preserve existing `optedIn` values
    - Customers with explicit opt-out are excluded from campaign filters
  - Write property-based tests capturing observed behavior patterns:
    - For all webhook customer creations (WhatsApp channel), verify `optedIn.whatsapp: true`
    - For all webhook customer creations (Instagram channel), verify `optedIn.instagram: true` and `optedIn.whatsapp: false`
    - For all customer update operations, verify existing `optedIn` values are preserved
    - For all customers with `optedIn.whatsapp: false`, verify they are excluded from campaign filters
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix for campaign opt-in initialization

  - [ ] 3.1 Implement the fix in POST /customers handler (manual creation)
    - Locate the customer creation code in `backend/routes/customers.js` (around line 169-174)
    - Add explicit `optedIn` field initialization to the Customer constructor:
      ```javascript
      const customer = new Customer({
        ...req.body,
        userId: req.user.id,
        phone,
        whatsappNumber,
        optedIn: {
          whatsapp: true,
          instagram: true,
          sms: true,
          email: true
        }
      });
      ```
    - Rationale: Manually created customers should default to opted-in for all channels since they are explicitly added by the user
    - _Bug_Condition: `isBugCondition(customerCreationInput)` where `customerCreationInput.endpoint = 'POST /customers'` and `customerCreationInput.customerData.optedIn IS undefined`_
    - _Expected_Behavior: `savedDocument.optedIn.whatsapp === true` from design_
    - _Preservation: Webhook creation, update operations, and Instagram channel handling remain unchanged_
    - _Requirements: 2.1, 2.3_

  - [ ] 3.2 Implement the fix in POST /customers/import/csv handler (bulk import)
    - Locate the customer creation code in CSV import loop in `backend/routes/customers.js` (around line 470-483)
    - Add explicit `optedIn` field initialization to the Customer constructor:
      ```javascript
      const customer = new Customer({
        userId: req.user.id,
        firstName,
        lastName: lastName || undefined,
        email: emailVal ? String(emailVal).trim() : undefined,
        phone: normalizedNumber,
        whatsappNumber: normalizedNumber,
        instagramHandle: instagramHandleVal ? String(instagramHandleVal).trim() : undefined,
        language: languageVal ? String(languageVal).trim() : 'en',
        location: addressVal ? { address: String(addressVal).trim(), country: 'India' } : undefined,
        rfmSegment,
        loyaltyTier,
        importedAt: new Date(),
        optedIn: {
          whatsapp: true,
          instagram: true,
          sms: true,
          email: true
        }
      });
      ```
    - Rationale: Imported customers are intended for bulk campaigns and should default to opted-in for all channels
    - _Bug_Condition: `isBugCondition(customerCreationInput)` where `customerCreationInput.endpoint = 'POST /customers/import/csv'` and `customerCreationInput.customerData.optedIn IS undefined`_
    - _Expected_Behavior: `savedDocument.optedIn.whatsapp === true` for all imported customers from design_
    - _Preservation: Webhook creation, update operations, and Instagram channel handling remain unchanged_
    - _Requirements: 2.2, 2.4_

  - [ ] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Manual and Imported Customers Have optedIn.whatsapp
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify manually created customers have `optedIn.whatsapp: true`
    - Verify CSV-imported customers have `optedIn.whatsapp: true`
    - Verify these customers are now included in campaign filter results
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Webhook and Update Operations Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm webhook-created WhatsApp customers still get `optedIn.whatsapp: true`
    - Confirm webhook-created Instagram customers still get `optedIn.whatsapp: false, instagram: true`
    - Confirm customer updates preserve existing `optedIn` values
    - Confirm customers with opt-out are still excluded from campaigns
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run all property-based tests (bug condition + preservation)
  - Verify all tests pass without errors
  - Confirm manually created customers can receive campaigns
  - Confirm CSV-imported customers can receive campaigns
  - Confirm webhook-created customers continue to work correctly
  - Confirm customer updates preserve opt-in preferences
  - Ask the user if questions arise about test results or behavior
