# Campaign Opt-In Fix Bugfix Design

## Overview

Manually created and CSV-imported customers cannot receive campaign messages because the `optedIn.whatsapp` field is not explicitly set during creation. While the Customer model schema defines a default value of `true` for this field, Mongoose does not apply schema defaults when fields are entirely omitted from the document creation. The campaign filtering logic in `appendWhatsAppOptInQuery` (campaigns.js) requires `optedIn.whatsapp: true`, causing these customers to be excluded.

This fix will ensure that both the POST `/customers` endpoint (manual creation) and POST `/customers/import/csv` endpoint (bulk import) explicitly set `optedIn.whatsapp: true` when creating customer documents, enabling them to receive campaign messages immediately upon creation.

The fix is minimal and targeted: add explicit `optedIn` field initialization in both customer creation code paths while preserving all existing behavior for webhook-created customers, opt-out functionality, and Instagram customers.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when customers are created via manual creation endpoint or CSV import, resulting in `optedIn` field being undefined or incomplete
- **Property (P)**: The desired behavior - manually created and imported customers should have `optedIn.whatsapp: true` and be included in WhatsApp campaigns
- **Preservation**: Existing webhook behavior, opt-out functionality, Instagram channel handling, and update operations that must remain unchanged by the fix
- **appendWhatsAppOptInQuery**: The filtering function in `backend/routes/campaigns.js` (line 22-28) that restricts campaigns to customers with `optedIn.whatsapp: true`
- **Customer Creation Endpoint**: The POST `/customers` route handler in `backend/routes/customers.js` (line 138-179) that creates individual customers manually
- **CSV Import Endpoint**: The POST `/customers/import/csv` route handler in `backend/routes/customers.js` (line 321-540) that bulk imports customers from Excel/CSV files
- **aiChatHandler Customer Creation**: The webhook-driven customer creation in `backend/services/aiChatHandler.js` (line 1082-1085) that explicitly sets optedIn based on channel

## Bug Details

### Bug Condition

The bug manifests when customers are created through either the manual creation endpoint or CSV import endpoint. The code creates new Customer documents without explicitly setting the `optedIn` object, relying on Mongoose schema defaults. However, Mongoose only applies defaults when the field is explicitly set to `undefined`, not when it's omitted entirely from the object constructor. This causes the `optedIn.whatsapp` field to be missing or undefined in the saved document.

**Formal Specification:**
```
FUNCTION isBugCondition(customerCreationInput)
  INPUT: customerCreationInput of type { endpoint: string, customerData: object }
  OUTPUT: boolean
  
  RETURN (customerCreationInput.endpoint IN ['POST /customers', 'POST /customers/import/csv'])
         AND (customerCreationInput.customerData.optedIn IS undefined OR customerCreationInput.customerData.optedIn.whatsapp IS undefined)
         AND NOT (customerCreationInput.customerData comes from webhook in aiChatHandler)
END FUNCTION
```

### Examples

- **Manual Creation**: User creates a customer via the frontend with name "John Doe", phone "9876543210". The POST handler creates `new Customer({ userId, firstName: "John", lastName: "Doe", phone: "9876543210", whatsappNumber: "9876543210" })` without setting `optedIn`. Result: Document saved without `optedIn.whatsapp: true`, customer excluded from campaigns.

- **CSV Import**: User imports 1000 customers via Excel upload. The import loop creates `new Customer({ userId, firstName, lastName, phone, whatsappNumber, rfmSegment, loyaltyTier, importedAt })` without setting `optedIn`. Result: All 1000 customers saved without `optedIn.whatsapp: true`, all excluded from campaigns.

- **Webhook Creation (Working Correctly)**: Customer sends "hi" on WhatsApp. The aiChatHandler creates `new Customer({ ..., optedIn: { whatsapp: true, instagram: false } })` with explicit optedIn. Result: Document saved with `optedIn.whatsapp: true`, customer can receive campaigns.

- **Edge Case - Instagram Webhook (Should Preserve)**: Customer sends message via Instagram. The aiChatHandler creates customer with `optedIn: { whatsapp: false, instagram: true }`. Result: Customer can receive Instagram campaigns but not WhatsApp campaigns (correct behavior to preserve).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Webhook-created customers (aiChatHandler.js) must continue to set `optedIn` based on channel (WhatsApp vs Instagram)
- Customer update operations (PUT `/customers/:id`) must continue to preserve existing `optedIn` preferences
- Customers with explicit opt-out settings must continue to be respected by campaign filters
- The `appendWhatsAppOptInQuery` filtering logic must continue to check `optedIn.whatsapp: true`
- Instagram customers created via webhook must continue to have `optedIn.whatsapp: false`
- Schema defaults for all other Customer model fields must continue to work as before

**Scope:**
All customer creation paths that do NOT involve the manual creation endpoint or CSV import endpoint should be completely unaffected by this fix. This includes:
- Webhook-driven customer creation in aiChatHandler.js
- Customer update operations via PUT `/customers/:id`
- RFM score updates via POST `/customers/analytics/update-rfm`
- Any other customer modification operations

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Mongoose Default Application Behavior**: The Customer schema defines `optedIn.whatsapp: { type: Boolean, default: true }`, but Mongoose only applies schema defaults when a field is explicitly set to `undefined` or when using specific options like `setDefaultsOnInsert`. When the `optedIn` field is completely omitted from the constructor (e.g., `new Customer({ firstName, lastName, phone })`), Mongoose does not initialize nested defaults.

2. **Omission in Manual Creation Endpoint**: The POST `/customers` handler (line 138-179) creates customers with `new Customer({ ...req.body, userId, phone, whatsappNumber })`. Since `req.body` does not contain `optedIn` and the code doesn't explicitly add it, the field remains undefined in the saved document.

3. **Omission in CSV Import Endpoint**: The POST `/customers/import/csv` handler (line 321-540) creates customers with `new Customer({ userId, firstName, lastName, email, phone, whatsappNumber, language, location, rfmSegment, loyaltyTier, importedAt })`. The `optedIn` field is not included, so it remains undefined.

4. **Contrast with Webhook Behavior**: The aiChatHandler.js explicitly sets `optedIn: { whatsapp: !isInstagram, instagram: isInstagram }` (line 1082-1085), which is why webhook-created customers work correctly.

## Correctness Properties

Property 1: Bug Condition - Manual and Imported Customers Opt-In to WhatsApp

_For any_ customer creation request where the customer is created via POST `/customers` (manual creation) or POST `/customers/import/csv` (bulk import), the system SHALL create the customer document with `optedIn.whatsapp: true`, enabling the customer to receive WhatsApp campaign messages when filtered by `appendWhatsAppOptInQuery`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Webhook and Update Operations Unchanged

_For any_ customer creation or modification that is NOT via manual creation or CSV import (specifically: webhook creation in aiChatHandler, customer updates via PUT, RFM updates), the system SHALL continue to handle the `optedIn` field exactly as it did before the fix, preserving webhook channel detection logic, opt-out respect, and existing field preservation in updates.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct, the fix requires explicit initialization of the `optedIn` object in both customer creation endpoints.

**File**: `backend/routes/customers.js`

**Function 1**: POST `/customers` handler (line 138-179)

**Specific Changes**:
1. **Add optedIn Initialization**: After line 174 where the customer object is created, explicitly set the `optedIn` field:
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

2. **Rationale**: This matches the schema defaults and ensures customers can receive campaigns immediately. All channels default to `true` for manually created customers since the user explicitly wants to add them to the system.

**Function 2**: POST `/customers/import/csv` handler (line 321-540)

**Specific Changes**:
1. **Add optedIn Initialization**: Around line 502-513 where the customer object is created in the import loop, add the `optedIn` field:
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

2. **Rationale**: Imported customers are intended for bulk campaigns. Setting all channels to `true` ensures they can receive messages immediately. Users can manually opt out specific customers later if needed.

**No Changes Required**:
- `backend/services/aiChatHandler.js`: Already correctly sets `optedIn` based on channel
- `backend/routes/campaigns.js`: The `appendWhatsAppOptInQuery` function is working correctly
- `backend/models/Customer.js`: Schema defaults are correct; the issue is in how documents are created
- PUT `/customers/:id` handler: Should preserve existing `optedIn` values (no changes needed)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (exploratory checking), then verify the fix works correctly (fix checking) and preserves existing behavior (preservation checking).

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that manually created and CSV-imported customers lack the `optedIn.whatsapp` field and are excluded from campaigns.

**Test Plan**: Write tests that create customers via both endpoints, inspect the saved documents, and verify they are excluded by campaign filters. Run these tests on the UNFIXED code to observe failures and validate the root cause.

**Test Cases**:
1. **Manual Creation Test**: POST a customer via `/customers` endpoint, query the database for the created document, assert that `optedIn.whatsapp` is undefined or false (will fail on unfixed code - field will be missing)
2. **CSV Import Test**: POST a CSV file with 3 customers via `/customers/import/csv`, query the database for imported documents, assert that all 3 have `optedIn.whatsapp: true` (will fail on unfixed code - field will be missing)
3. **Campaign Filter Test**: Create a customer manually, run `appendWhatsAppOptInQuery` filter, assert customer is included in results (will fail on unfixed code - customer will be excluded)
4. **Bulk Campaign Test**: Import 10 customers via CSV, create a campaign targeting all customers, assert campaign sends to all 10 (will fail on unfixed code - 0 messages sent)

**Expected Counterexamples**:
- Manually created customers will have documents without `optedIn` field or with `optedIn: {}` (empty object)
- Imported customers will similarly lack the `optedIn.whatsapp: true` field
- Campaign queries will return empty result sets when filtering for these customers
- Possible root cause confirmation: Mongoose not applying nested schema defaults when field is omitted

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (manual creation and CSV import), the fixed code produces the expected behavior (customers have `optedIn.whatsapp: true`).

**Pseudocode:**
```
FOR ALL customerInput WHERE isBugCondition(customerInput) DO
  createdCustomer := createCustomer_fixed(customerInput)
  savedDocument := database.find(createdCustomer._id)
  ASSERT savedDocument.optedIn.whatsapp === true
  ASSERT appendWhatsAppOptInQuery includes savedDocument in results
END FOR
```

**Test Cases**:
1. **Manual Creation Fix Verification**: POST customer via `/customers`, verify `optedIn.whatsapp: true` in database
2. **CSV Import Fix Verification**: Import 5 customers, verify all 5 have `optedIn.whatsapp: true`
3. **Campaign Filter Inclusion Test**: Create customer manually, verify `appendWhatsAppOptInQuery` includes them
4. **End-to-End Campaign Test**: Import 10 customers, create and send campaign, verify 10 messages sent successfully

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (webhook creation, updates, Instagram customers), the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL customerInput WHERE NOT isBugCondition(customerInput) DO
  ASSERT createCustomer_original(customerInput).optedIn = createCustomer_fixed(customerInput).optedIn
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss (e.g., Instagram vs WhatsApp channel differences)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for webhook creation, updates, and Instagram customers, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Webhook Creation Preservation**: Simulate webhook message from WhatsApp, observe that aiChatHandler creates customer with `optedIn: { whatsapp: true, instagram: false }` on unfixed code, write test to verify this continues after fix
2. **Instagram Webhook Preservation**: Simulate webhook message from Instagram, observe that aiChatHandler creates customer with `optedIn: { whatsapp: false, instagram: true }` on unfixed code, write test to verify this continues after fix
3. **Customer Update Preservation**: Create a customer (any method), manually set `optedIn.whatsapp: false` via database, call PUT `/customers/:id` with name change, verify `optedIn.whatsapp` remains `false` after update
4. **Opt-Out Respect Preservation**: Create a customer with explicit opt-out, verify campaign filter continues to exclude them
5. **RFM Update Preservation**: Create customer with specific `optedIn` values, run RFM score update, verify `optedIn` values unchanged

### Unit Tests

- Test manual customer creation sets `optedIn.whatsapp: true`
- Test CSV import sets `optedIn.whatsapp: true` for all imported customers
- Test that customers with `optedIn.whatsapp: true` are included in `appendWhatsAppOptInQuery` results
- Test that webhook-created WhatsApp customers continue to get `optedIn.whatsapp: true`
- Test that webhook-created Instagram customers continue to get `optedIn.whatsapp: false`
- Test edge case: Empty CSV import succeeds without errors
- Test edge case: Customer update preserves existing `optedIn` values

### Property-Based Tests

- Generate random customer data (names, phones, emails) and verify manual creation always sets `optedIn.whatsapp: true`
- Generate random CSV files with varying column orders and data quality, verify all successfully imported customers have `optedIn.whatsapp: true`
- Generate random update payloads and verify PUT operations never modify `optedIn` field unless explicitly included in request body
- Test across many webhook scenarios (different channels, different message types) to verify preservation of existing channel detection logic

### Integration Tests

- Full flow: Create customer manually → Add to campaign → Verify message sent successfully
- Full flow: Import CSV with 100 customers → Create campaign targeting imported segment → Verify 100 messages sent
- Full flow: Webhook creates customer → Add to campaign → Verify message sent (ensure webhook path still works)
- Full flow: Create customer manually → User opts out via separate endpoint → Verify campaign excludes opted-out customer
- Context switching: Mix of webhook customers, manually created customers, and imported customers all in same campaign → Verify correct filtering and message sending
