# Task 4: List Response Backend Implementation

## Summary
Implement backend services to support the List Response Builder UI component. Users can create list-format responses where each row can be triggered by keywords, and each row has a response message plus button actions (URL, Call, QuickReply, Custom).

## Tasks

### Task 1: Create ListResponse Model
Create MongoDB model for storing list response configurations.

**Sub-tasks:**
- [x] Define schema with fields: userId, name, listItems array (title, description, triggerKeyword, responseText, buttonType, buttonValue)
- [x] Add indexes for userId and isActive
- [x] Export model

**Files to create:**
- `backend/models/ListResponse.js`

---

### Task 2: Create List API Routes
Create REST API endpoints for managing list responses.

**Sub-tasks:**
- [x] POST `/api/lists` - Create new list response
- [x] GET `/api/lists` - Get all list responses for user
- [x] GET `/api/lists/:id` - Get specific list response
- [x] PUT `/api/lists/:id` - Update list response
- [x] DELETE `/api/lists/:id` - Delete list response
- [x] POST `/api/lists/select-item` - Handle list item selection and send response

**Files to create:**
- `backend/routes/lists.js`

---

### Task 3: Implement List Item Selection Logic
Add keyword matching and response generation in webhook handler.

**Sub-tasks:**
- [x] Query ListResponse documents for matching trigger keywords
- [x] Extract selected row data when user input matches trigger keyword
- [x] Interpolate variables in response text (using VariableInterpolationService)
- [x] Format response message with button actions
- [x] Send formatted response back through messaging service

**Files to modify:**
- `backend/routes/webhooks.js` - Add list selection logic

---

### Task 4: Integrate Variable Interpolation
Ensure variables like `{{customer_name}}`, `{{gold_rate_22k}}` work in list responses.

**Sub-tasks:**
- [x] Pass customer context to variable interpolation
- [x] Replace variables in response text before sending
- [x] Test with sample variables

**Files to modify:**
- `backend/routes/lists.js` - Include variable service in response generation

---

### Task 5: Integration Testing
Test complete flow: list creation, triggering, variable interpolation, and response sending.

**Sub-tasks:**
- [x] Create list response via API
- [x] Send message matching trigger keyword
- [x] Verify response is sent with selected row data
- [x] Verify variables are interpolated correctly
- [x] Verify button actions are formatted correctly

---
