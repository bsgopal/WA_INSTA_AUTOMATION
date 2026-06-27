# Requirements: LIST-Based Conditional Workflow Routing

## Feature Overview
Enable users to create conditional workflows that route to different responses based on which LIST item a user selects. Build decision trees (flowcharts) where each LIST option triggers different actions or follow-up messages.

## Business Goals
- Allow jewelry shop to respond differently based on customer's product selection
- Example: User selects "Rings" (option 1) → Show rings catalog
- Example: User selects "Chains" (option 2) → Show chains catalog
- Support complex multi-step customer journeys
- Reduce manual intervention by automating conditional responses

## User Stories

### Story 1: Create List Conditional Workflow
**As a** customer service manager
**I want to** create a workflow that responds based on which LIST item a customer selects
**So that** I can automate different responses for each product category

**Acceptance Criteria:**
- [ ] Can create a new workflow from "Conditional Response" template
- [ ] Visual flowchart builder shows workflow as connected nodes
- [ ] Can drag-and-drop to add decision nodes
- [ ] Each node displays its condition and action
- [ ] Can save workflow and it converts to JSON format
- [ ] Workflow appears in "Active Workflows" list
- [ ] Can view JSON representation for technical users

### Story 2: Configure LIST Item Conditions
**As a** business user
**I want to** specify which LIST items trigger which responses
**So that** I can route customers to the right information

**Acceptance Criteria:**
- [ ] Can select a LIST response rule as workflow trigger
- [ ] Can add condition: "If selected item = 'Rings' (option 1)"
- [ ] Can add condition: "If selected item = 'Chains' (option 2)"
- [ ] Can add default condition: "If user selects any other option"
- [ ] Can link each condition to a response (send template, send message, trigger workflow)
- [ ] Visual indication of which branch is default
- [ ] Can reorder conditions

### Story 3: Visual Flowchart Builder (Prototype)
**As a** workflow designer
**I want to** see the workflow as a visual flowchart
**So that** I can understand and modify the logic easily

**Acceptance Criteria:**
- [ ] Start node shows the LIST rule being used
- [ ] Decision diamond nodes show conditions (e.g., "Selected = Rings?")
- [ ] Action rectangles show responses (e.g., "Send Rings Catalog")
- [ ] Arrows connect nodes showing flow direction
- [ ] YES/NO branches clearly labeled
- [ ] Can drag nodes to rearrange layout (optional)
- [ ] Zooming and panning supported (optional)

### Story 4: Execute Conditional Workflow
**As a** system
**I want to** automatically route customers when they select a LIST item
**So that** the customer gets the right response immediately

**Acceptance Criteria:**
- [ ] Webhook detects when user selects a LIST item
- [ ] Workflow engine receives selected item ID and text
- [ ] CONDITION step evaluates selected item
- [ ] Correct branch executes based on condition match
- [ ] Response is sent to customer automatically
- [ ] Execution is logged for analytics
- [ ] Fallback response sent if no condition matches

### Story 5: Test Workflow
**As a** workflow creator
**I want to** test the workflow before activating it
**So that** I can verify it works correctly

**Acceptance Criteria:**
- [ ] Can run simulation with different LIST selections
- [ ] Simulation shows which branch executes for each selection
- [ ] Can see final response that would be sent
- [ ] Errors are clearly reported
- [ ] No actual messages sent during testing
- [ ] Can test with real customer data (optional)

### Story 6: Monitor Workflow Execution
**As a** business owner
**I want to** see analytics on workflow execution
**So that** I can optimize the workflow

**Acceptance Criteria:**
- [ ] Dashboard shows total executions per workflow
- [ ] Shows which branches are executed most frequently
- [ ] Shows response rate per branch
- [ ] Can filter by date range
- [ ] Can see which customers went through which branches
- [ ] Export execution logs as CSV

## Technical Requirements

### Workflow Triggers
- Trigger Type: `RESPONSE_RULE_SELECTION`
- Trigger when: User selects a specific Response Rule with LIST block
- Pass context: { selectedItemId, selectedItemTitle, responseRuleId, customerId }

### CONDITION Step Enhancement
- Support new field type: `listItemSelected`
- Operators:
  - `equals` - matches specific item ID (e.g., "row_1")
  - `contains` - item description contains text
  - `in` - item ID in list of IDs (for grouping options)

### Workflow Execution Context
```javascript
{
  selectedItemId: "row_1",           // Unique ID of selected row
  selectedItemTitle: "Rings",        // Display title of row
  selectedItemDescription: "22k Men Rings",
  responseRuleId: "rule_123",        // Which LIST rule was triggered
  customerId: "cust_456",
  listSectionTitle: "Collections",   // Which section in LIST
  // ... standard customer fields
}
```

### Response Types
- SEND_MESSAGE: Send text response
- SEND_TEMPLATE: Send message template
- SEND_RESPONSE_RULE: Execute another Response Rule
- TRIGGER_WORKFLOW: Execute another workflow
- UPDATE_CUSTOMER: Tag or update customer data
- HUMAN_HANDOVER: Escalate to human agent

### Data Models

**Workflow Configuration (JSON):**
```json
{
  "name": "Collection Router",
  "trigger": {
    "type": "RESPONSE_RULE_SELECTION",
    "responseRuleId": "rule_123"
  },
  "steps": [
    {
      "id": "step_1",
      "type": "CONDITION",
      "name": "Which collection?",
      "config": {
        "field": "selectedItemId",
        "operator": "equals",
        "value": "row_1"
      },
      "nextStepId": "step_2",
      "alternateStepId": "step_3"
    },
    {
      "id": "step_2",
      "type": "SEND_MESSAGE",
      "name": "Send Rings Info",
      "config": {
        "channel": "whatsapp",
        "template": "Here are our rings: ...",
        "templateId": "template_rings"
      },
      "nextStepId": null
    }
  ]
}
```

## UI Requirements

### Workflow Builder Page
- Left Panel: Response Rules library (LIST rules available for routing)
- Center Panel: Visual flowchart canvas
- Right Panel: Node configuration form
- Top: Toolbar (Save, Test, Activate, Preview)
- Bottom: JSON view toggle

### Node Types in Flowchart
1. **Start Node** (green)
   - Shows: "Customer selects from [LIST Rule Name]"
   - Non-editable
   
2. **Decision Node** (diamond - yellow)
   - Shows: "Selected = [Item Title]?"
   - Editable via right panel
   - Shows YES/NO branches
   
3. **Action Node** (rectangle - blue)
   - Shows: Action type and brief description
   - Editable via right panel
   - Can drag connections
   
4. **End Node** (red circle)
   - Terminal node, shows message sent to customer

### Right Panel Form (Dynamic)
Changes based on selected node type:

**Decision Node Form:**
- Field selector: "listItemSelected" (auto-selected)
- Operator: equals / contains / in
- Value: Dropdown of available LIST items from selected rule
- OR custom value entry

**Action Node Form:**
- Action Type: Send Message / Send Template / Trigger Workflow / Human Handover
- Conditional fields based on action type:
  - If Send Message: Message text input with variable support
  - If Send Template: Template selector
  - If Trigger Workflow: Workflow selector
  - If Human Handover: Team assignment

## Success Metrics
- [ ] Users can create conditional workflows in < 2 minutes
- [ ] 95% successful routing (correct response based on selection)
- [ ] < 100ms latency between selection and response
- [ ] Can handle 100+ concurrent workflow executions
- [ ] 0 messages sent to wrong customers
- [ ] Analytics show clear branch distribution

## Constraints & Assumptions
1. LIST Response Rule must already exist before creating workflow
2. User must have permission to view/edit the Response Rule
3. LIST rule cannot be deleted if workflow depends on it
4. Maximum 10 decision branches per workflow (can increase later)
5. Workflow execution timeout: 30 seconds
6. Maximum workflow depth: 5 levels (to prevent infinite loops)

## Scope Boundaries
- **In Scope**: LIST selection routing, visual builder, basic conditions
- **Out of Scope**: AI-powered routing decisions, A/B testing variants, advanced ML conditions
- **Future**: Analytics dashboard, workflow templates library, collaboration features

## Dependencies
- Response Rule model (already exists)
- Workflow model (already exists)
- Workflow Engine service (needs enhancement)
- Webhook handler (needs enhancement)
- Frontend: React Flow library for visual builder

## Acceptance Criteria (Feature Complete)
1. ✅ Webhook detects LIST item selection and triggers workflow
2. ✅ Workflow executes conditional routing based on selected item
3. ✅ Visual flowchart builder available with drag-and-drop
4. ✅ JSON representation editable for power users
5. ✅ Test mode available before activation
6. ✅ Analytics dashboard shows execution metrics
7. ✅ Multiple decision branches supported (up to 10)
8. ✅ Error handling and fallback responses
9. ✅ Documentation and user guide provided
10. ✅ All tests passing (unit + integration)

## Questions for Clarification
1. Should workflows support nested conditions (condition inside condition)?
2. Should we support time-based conditions (e.g., "only during business hours")?
3. Should failed workflows auto-retry or escalate to human?
4. Should workflow execution logs be visible to customers?
5. Do you want A/B testing - send different responses randomly?
