# Tasks: LIST-Based Conditional Workflow Routing

## Task 1: Enhance ConversationLog Model with Interaction Context

**Objective:** Add fields to store LIST selection details and response rule reference

**Sub-tasks:**
- [~] Add `responseRuleId` field (ObjectId ref to ResponseRule)
- [ ] Add `interactionContext` object with fields:
  - [~] `type` (enum: LIST_SELECTION, BUTTON_PRESS, QUICK_REPLY, TEXT_INPUT)
  - [~] `selectedItemId` (String - the row ID that was selected)
  - [~] `selectedItemTitle` (String - display name)
  - [~] `selectedItemDescription` (String - subtitle)
  - [~] `listSectionTitle` (String - section name if applicable)
  - [~] `listTitle` (String - main LIST title)
- [~] Add database indexes for faster queries
- [~] Update ConversationLog schema with defaults
- [~] Write unit tests for schema validation

**Files to modify:**
- `backend/models/ConversationLog.js`

**Acceptance Criteria:**
- ✅ ConversationLog can store LIST selection details
- ✅ Data is optional (backward compatible)
- ✅ Queries can filter by responseRuleId and interaction type
- ✅ All tests pass

---

## Task 2: Enhance Webhook Handler to Detect LIST Selection

**Objective:** Parse LIST item selections from WhatsApp webhook and extract details

**Sub-tasks:**
- [~] Update `parseWebhookData()` to detect LIST selections
- [~] Extract `selectedItemId` from webhook (row ID)
- [~] Extract `selectedItemTitle` from webhook
- [~] Extract `selectedItemDescription` if available
- [ ] Determine which ResponseRule triggered the LIST
  - [~] Query ConversationLog to find recent LIST message
  - [~] Extract responseRuleId from that message
- [~] Create helper function `isListSelection(data)`
- [~] Create helper function `extractListSelection(data)`
- [~] Add tests for various webhook formats (WAHA, Whatsapp-Web-js, etc.)

**Files to modify:**
- `backend/routes/webhooks.js`

**Acceptance Criteria:**
- ✅ LIST selections correctly identified
- ✅ Item ID and title accurately extracted
- ✅ ResponseRule ID correctly determined
- ✅ Handles various webhook formats
- ✅ Graceful fallback if responseRuleId not found
- ✅ All tests pass

---

## Task 3: Update Webhook Handler to Store Interaction Context

**Objective:** Store LIST selection details in ConversationLog for workflow routing

**Sub-tasks:**
- [ ] When LIST selection detected, create ConversationLog entry with:
  - [~] `responseRuleId` set to identified rule
  - [~] `interactionContext.type` = 'LIST_SELECTION'
  - [~] `interactionContext.selectedItemId`
  - [~] `interactionContext.selectedItemTitle`
  - [~] Store full LIST config for reference
- [~] Pass context to downstream workflow trigger
- [~] Add logging for debugging
- [~] Handle errors gracefully

**Files to modify:**
- `backend/routes/webhooks.js`

**Acceptance Criteria:**
- ✅ ConversationLog correctly stores LIST selection
- ✅ Context is accessible to workflow engine
- ✅ No data loss on errors
- ✅ Backward compatible with non-LIST messages

---

## Task 4: Update Workflow Model for RESPONSE_RULE_SELECTION Trigger

**Objective:** Add new trigger type for Response Rule selection events

**Sub-tasks:**
- [~] Add trigger type `RESPONSE_RULE_SELECTION` to enum
- [ ] Add fields to trigger config:
  - [~] `responseRuleId` (ObjectId - which LIST rule triggers this)
  - [~] `responseRuleName` (String - display name)
  - [~] `cachedListConfig` (Object - cache LIST items for quick reference)
- [~] Add validation to ensure referenced ResponseRule exists
- [~] Update indexes for faster trigger lookups
- [~] Create validator function `validateResponseRuleTrigger()`
- [~] Write comprehensive tests

**Files to modify:**
- `backend/models/Workflow.js`

**Acceptance Criteria:**
- ✅ RESPONSE_RULE_SELECTION trigger type supported
- ✅ Trigger config properly validated
- ✅ ResponseRule reference cannot be orphaned
- ✅ All tests pass

---

## Task 5: Enhance Workflow Engine to Handle LIST Selection Events

**Objective:** Add workflow trigger and execution for LIST item selections

**Sub-tasks:**
- [~] Create new function `triggerResponseRuleWorkflows(responseRuleId, eventData)`
- [ ] Query for workflows with:
  - [~] `status` = ACTIVE
  - [~] `trigger.type` = RESPONSE_RULE_SELECTION
  - [~] `trigger.responseRuleId` = provided ID
- [ ] Pass event data as workflow execution context:
  - [~] selectedItemId
  - [~] selectedItemTitle
  - [~] customer data
  - [~] other relevant context
- [~] Handle multiple workflows for same trigger
- [~] Add error handling for failed executions
- [~] Add comprehensive logging

**Files to modify:**
- `backend/services/workflowEngine.js`

**Acceptance Criteria:**
- ✅ Function correctly triggers workflows on LIST selection
- ✅ Multiple workflows can listen to same trigger
- ✅ Context properly passed to workflow steps
- ✅ Error handling prevents cascade failures
- ✅ Logging allows debugging

---

## Task 6: Enhance CONDITION Step to Support LIST Item Evaluation

**Objective:** Support evaluating LIST item selections in CONDITION steps

**Sub-tasks:**
- [ ] Update `executeCondition()` function to support new field types:
  - [~] `selectedItemId` (from workflow context)
  - [~] `selectedItemTitle`
  - [~] Custom nested field paths
- [ ] Support operators:
  - [~] `equals` - exact match on item ID
  - [~] `contains` - item title contains text
  - [~] `in` - item ID is in list of values (for grouping)
  - [~] `not_equals` - item ID doesn't match
- [ ] Support value types:
  - [~] Literal string: `"row_1"`
  - [~] Array: `["row_1", "row_2"]`
  - [~] Field reference: `{{selectedItemId}}`
- [~] Add helper function to get nested context values
- [~] Write comprehensive tests for all combinations

**Files to modify:**
- `backend/services/workflowEngine.js`

**Acceptance Criteria:**
- ✅ All operators work correctly with context values
- ✅ Handles missing values gracefully
- ✅ Supports context-based conditions
- ✅ Performance is acceptable (< 10ms per condition)
- ✅ All tests pass

---

## Task 7: Integrate Webhook LIST Detection with Workflow Trigger

**Objective:** Connect webhook handler to workflow trigger engine

**Sub-tasks:**
- [ ] In webhook handler, after storing ConversationLog:
  - [~] Call `workflowEngine.triggerResponseRuleWorkflows()`
  - [~] Pass responseRuleId and event context
- [~] Make workflow trigger async (fire-and-forget)
- [~] Add retry logic for transient failures
- [~] Add metrics/logging for trigger statistics
- [ ] Handle edge cases:
  - [~] No workflows listening
  - [~] Workflow execution timeout
  - [~] Workflow execution error
- [~] Write integration tests

**Files to modify:**
- `backend/routes/webhooks.js`
- `backend/services/workflowEngine.js`

**Acceptance Criteria:**
- ✅ Workflow triggers when user selects LIST item
- ✅ Correct branch executes based on selection
- ✅ Response reaches customer within 500ms
- ✅ Error handling prevents cascading failures
- ✅ Integration tests verify end-to-end flow

---

## Task 8: Add API Endpoint to Get LIST Items for Workflow Builder

**Objective:** Provide LIST items for workflow builder UI

**Sub-tasks:**
- [~] Create endpoint `GET /api/response-rules/:ruleId/list-items`
- [~] Validate rule exists and is of type LIST
- [~] Return structured list items:
  ```json
  {
    title: "Collections",
    sections: [{
      title: "Items",
      rows: [
        { id: "row_1", title: "Rings", description: "22k" }
      ]
    }]
  }
  ```
- [~] Add error handling for invalid rule ID
- [~] Add permission checks (user owns rule)
- [~] Write API tests

**Files to modify:**
- `backend/routes/responseRules.js` (or create new endpoint)

**Acceptance Criteria:**
- ✅ Returns correct LIST structure
- ✅ Only includes LIST type rules
- ✅ Permissions properly enforced
- ✅ API tests passing

---

## Task 9: Add API Endpoint to Test Workflow Conditional Routing

**Objective:** Allow users to test workflow with different LIST selections

**Sub-tasks:**
- [~] Create endpoint `POST /api/workflows/:workflowId/test`
- [ ] Accept test parameters:
  - [~] customerId
  - [ ] selectedItemId
  - [ ] selectedItemTitle
- [~] Simulate workflow execution without sending actual messages
- [ ] Return execution trace:
  - [~] Which steps executed
  - [~] Which branch was taken
  - [~] What message would be sent
  - [~] Any errors encountered
- [~] Add sandbox mode (no side effects)
- [ ] Write comprehensive tests

**Files to modify:**
- `backend/routes/workflows.js`

**Acceptance Criteria:**
- ✅ Can test with different selections
- ✅ Returns accurate execution trace
- ✅ No actual messages sent
- ✅ No side effects on customer data
- ✅ Errors clearly reported
- ✅ API tests passing

---

## Task 10: Create Frontend Workflow Builder Component (Basic)

**Objective:** Create basic workflow builder UI without visual canvas yet

**Sub-tasks:**
- [~] Create `/frontend/src/pages/Workflows/ConditionalWorkflowBuilder.jsx`
- [ ] Create form-based interface for:
  - [~] Selecting trigger response rule
  - [~] Adding conditions and actions
  - [~] Viewing JSON representation
- [~] Support editing workflow steps as JSON
- [ ] Create helper components:
  - [~] ResponseRuleSelector
  - [~] ConditionBuilder
  - [~] ActionBuilder
- [~] Add Save, Test, Activate buttons
- [~] Implement test mode with test data input
- [~] Show test results

**Files to create:**
- `frontend/src/pages/Workflows/ConditionalWorkflowBuilder.jsx`
- `frontend/src/components/ConditionBuilder.jsx`
- `frontend/src/components/ActionBuilder.jsx`

**Acceptance Criteria:**
- ✅ Can create workflow with JSON config
- ✅ Can test workflow with different selections
- ✅ Can save and activate workflow
- ✅ JSON representation is editable
- ✅ Form validates before save
- ✅ Tests passing

---

## Task 11: Add Frontend API Integration for Workflow Operations

**Objective:** Connect frontend to workflow backend APIs

**Sub-tasks:**
- [ ] Add API client functions:
  - [~] `createConditionalWorkflow(config)`
  - [~] `updateWorkflow(workflowId, config)`
  - [~] `getListItems(responseRuleId)`
  - [~] `testWorkflow(workflowId, testData)`
  - [~] `activateWorkflow(workflowId)`
  - [~] `getWorkflowStats(workflowId)`
- [~] Add error handling and user feedback
- [~] Add loading states
- [~] Implement optimistic updates
- [~] Add to existing API client

**Files to modify:**
- `frontend/src/api/client.js` (or new file)

**Acceptance Criteria:**
- ✅ All API calls working
- ✅ Error messages user-friendly
- ✅ Loading states shown
- ✅ Data properly formatted

---

## Task 12: Create Visual Workflow Canvas Component (React Flow)

**Objective:** Create visual flowchart builder with drag-and-drop nodes

**Sub-tasks:**
- [~] Install and setup React Flow library
- [ ] Create node components:
  - [~] StartNode (green circle)
  - [~] DecisionNode (yellow diamond)
  - [~] ActionNode (blue rectangle)
  - [~] EndNode (red circle)
- [~] Create edge rendering
- [~] Implement node addition logic
- [~] Implement node deletion logic
- [~] Implement edge connection
- [~] Add right sidebar node editor
- [~] Implement auto-layout option
- [~] Add zoom and pan controls

**Files to create:**
- `frontend/src/components/WorkflowCanvas.jsx`
- `frontend/src/components/WorkflowNodes/StartNode.jsx`
- `frontend/src/components/WorkflowNodes/DecisionNode.jsx`
- `frontend/src/components/WorkflowNodes/ActionNode.jsx`
- `frontend/src/components/WorkflowNodes/EndNode.jsx`
- `frontend/src/components/WorkflowNodeEditor.jsx`

**Acceptance Criteria:**
- ✅ Nodes render correctly
- ✅ Connections can be made/removed
- ✅ Node editor updates node config
- ✅ Canvas updates on JSON changes
- ✅ Smooth drag and drop
- ✅ No performance issues with 50+ nodes

---

## Task 13: Implement Workflow Builder Page Integration

**Objective:** Integrate all components into complete workflow builder page

**Sub-tasks:**
- [~] Create main `/frontend/src/pages/Workflows/ConditionalWorkflowBuilder.jsx`
- [ ] Layout:
  - [~] Left panel: Response rules list
  - [~] Center: Visual canvas or JSON editor
  - [~] Right panel: Node editor
  - [~] Top: Toolbar (Save, Test, Activate, etc.)
- [~] State management for workflow config
- [~] Toggle between visual and JSON modes
- [~] Auto-save to localStorage (draft)
- [~] Sync canvas and JSON representations
- [~] Add breadcrumb navigation

**Files to modify/create:**
- `frontend/src/pages/Workflows/ConditionalWorkflowBuilder.jsx`

**Acceptance Criteria:**
- ✅ All components properly integrated
- ✅ State management working
- ✅ Canvas and JSON stay in sync
- ✅ Can switch between modes
- ✅ Draft auto-saves
- ✅ Responsive layout

---

## Task 14: Add Workflow Execution Logging and Analytics

**Objective:** Track workflow execution for analytics and debugging

**Sub-tasks:**
- [ ] Create WorkflowExecution model to log:
  - [~] workflowId
  - [ ] customerId
  - [~] executionStartTime
  - [~] executionEndTime
  - [~] stepsExecuted (array of step results)
  - [~] branchTaken (which decision branch)
  - [~] outputMessage
  - [~] success status
  - [~] errorMessage if failed
- [~] Add logging in workflowEngine on each step
- [ ] Create stats endpoint to aggregate:
  - [~] Total executions
  - [~] Success rate
  - [~] Average execution time
  - [~] Branch distribution
- [~] Add database indexes for queries
- [~] Write tests

**Files to create/modify:**
- `backend/models/WorkflowExecution.js` (new)
- `backend/services/workflowEngine.js` (update)
- `backend/routes/workflows.js` (add stats endpoint)

**Acceptance Criteria:**
- ✅ All executions logged
- ✅ Stats endpoint working
- ✅ Performance acceptable (stats calculated quickly)
- ✅ Queries support filtering by date range
- ✅ Tests passing

---

## Task 15: Add Basic Analytics Dashboard for Workflows

**Objective:** Show workflow execution metrics to users

**Sub-tasks:**
- [~] Create `/frontend/src/pages/Workflows/WorkflowAnalytics.jsx`
- [ ] Display metrics:
  - [~] Total executions (chart)
  - [~] Success rate (percentage)
  - [~] Average response time
  - [~] Branch distribution (pie chart)
  - [~] Execution timeline
- [ ] Add filters:
  - [~] Date range
  - [~] Specific branch
- [~] Add export as CSV
- [~] Responsive design

**Files to create:**
- `frontend/src/pages/Workflows/WorkflowAnalytics.jsx`

**Acceptance Criteria:**
- ✅ All metrics displayed correctly
- ✅ Charts render properly
- ✅ Filters working
- ✅ Export to CSV working
- ✅ Responsive on mobile

---

## Task 16: Comprehensive Testing and Documentation

**Objective:** Ensure feature is reliable and well-documented

**Sub-tasks:**
- [ ] Unit tests:
  - [~] CONDITION step evaluation
  - [~] Workflow trigger detection
  - [~] LIST item extraction
  - [~] Context passing (80% coverage)
- [ ] Integration tests:
  - [~] End-to-end: Selection → Response
  - [~] Multiple workflows per trigger
  - [~] Error scenarios
- [ ] Load tests:
  - [~] 100+ concurrent executions
  - [~] Latency < 500ms average
- [ ] Write user documentation:
  - [~] How to create conditional workflow
  - [~] How to test workflow
  - [~] How to read analytics
  - [~] Examples and use cases
- [~] Create troubleshooting guide

**Acceptance Criteria:**
- ✅ 80%+ code coverage
- ✅ All integration tests passing
- ✅ Load tests show acceptable performance
- ✅ Documentation is complete and clear
- ✅ Examples provided for common scenarios

---

## Task 17: Deployment and Rollout

**Objective:** Deploy feature safely to production

**Sub-tasks:**
- [ ] Database migrations:
  - [~] Add new fields to ConversationLog
  - [~] Add workflow trigger type
  - [~] Create WorkflowExecution collection
- [~] Backward compatibility check
- [~] Feature flag implementation (optional)
- [~] Staging environment testing
- [~] Production deployment
- [~] Monitor for errors
- [~] Rollback plan if needed
- [~] Post-launch support

**Files to create:**
- Database migration scripts

**Acceptance Criteria:**
- ✅ All data migrations successful
- ✅ Zero data loss
- ✅ No existing workflows broken
- ✅ Feature works in production
- ✅ Performance acceptable
- ✅ Support team trained

---

## Summary

**Total Tasks:** 17
**Estimated Effort:** 60-80 hours
**Frontend:** ~25 hours (builder UI, integration)
**Backend:** ~30 hours (engine, APIs, logging)
**Testing:** ~15 hours (unit, integration, load tests)
**Documentation:** ~10 hours (guides, examples, troubleshooting)

**Priority Order:**
1. Tasks 1-7: Backend foundation (critical path)
2. Task 8-9: Backend APIs for frontend
3. Tasks 10-13: Frontend builder
4. Tasks 14-15: Analytics (nice-to-have)
5. Task 16: Testing & documentation
6. Task 17: Deployment

**Blockers:** None identified
**Dependencies:** React Flow library (for visual builder)
