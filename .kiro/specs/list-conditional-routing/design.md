# Design: LIST-Based Conditional Workflow Routing

## Architecture Overview

```
┌─────────────────┐
│  User selects   │
│  LIST item in   │
│  WhatsApp       │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────┐
│  Webhook receives           │
│  listReply event with:      │
│  - selectedItemId: "row_1"  │
│  - selectedItemTitle        │
│  - responseRuleId           │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  ConversationLog stores     │
│  interaction with context   │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  workflowEngine.trigger     │
│  event: RESPONSE_SELECTION  │
│  Finds workflows listening  │
│  to this responseRuleId     │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Workflow executes steps    │
│  - CONDITION: Check item    │
│  - ACTION: Send response    │
│  - LOG: Store execution     │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│  Response sent to customer  │
│  via WhatsAppService        │
└─────────────────────────────┘
```

## Component Design

### 1. Backend: Webhook Enhancement

**File:** `backend/routes/webhooks.js`

**Changes:**
```javascript
// Detect LIST selection in webhook
const extractListSelection = (data) => {
  return {
    selectedItemId: extractListReplyId(data),      // "row_1"
    selectedItemTitle: extractListReplyTitle(data),  // "Rings"
    selectedItemDescription: extractListReplyDesc(data),
    listSectionTitle: extractSectionTitle(data),
    interactionType: 'LIST_SELECTION'
  };
};

// After storing message, trigger workflow
if (isListSelection) {
  await workflowEngine.triggerWorkflowsByEvent('LIST_SELECTION', {
    customerId: customer._id,
    responseRuleId: null,  // Need to figure this out from conversation context
    selectedItemId: selection.selectedItemId,
    selectedItemTitle: selection.selectedItemTitle,
    ...selection
  });
}
```

**Challenge:** 
- Webhook needs to know which ResponseRule triggered the LIST
- Solution: Store `responseRuleId` in ConversationLog when LIST is sent

### 2. Backend: ConversationLog Enhancement

**File:** `backend/models/ConversationLog.js`

**Add fields:**
```javascript
{
  responseRuleId: ObjectId,  // Which ResponseRule sent the LIST
  messageBlocksConfig: {     // Store the blocks for reference
    type: 'LIST',
    sections: [...]
  },
  interactionContext: {      // For workflow routing
    type: 'LIST_SELECTION',
    selectedItemId: String,
    selectedItemTitle: String,
    listTitle: String
  }
}
```

### 3. Backend: Workflow Engine Enhancement

**File:** `backend/services/workflowEngine.js`

**New Trigger Type:** `RESPONSE_RULE_SELECTION`

```javascript
// New workflow trigger
const triggerResponseRuleWorkflows = async (responseRuleId, eventData) => {
  const workflows = await Workflow.find({
    status: 'ACTIVE',
    'trigger.type': 'RESPONSE_RULE_SELECTION',
    'trigger.responseRuleId': responseRuleId
  });

  for (const workflow of workflows) {
    await executeWorkflow(
      workflow._id,
      eventData.customerId,
      eventData  // Contains selectedItemId, selectedItemTitle, etc.
    );
  }
};
```

**Enhanced CONDITION Step:**

```javascript
const executeCondition = async (step, customer, context) => {
  const { field, operator, value } = step.config;
  
  // Support new field: listItemSelected
  let fieldValue = context[field] || customer[field];
  
  // Support nested paths like "selectedItem.id"
  if (field.includes('.')) {
    fieldValue = getNestedValue(context, field);
  }

  let conditionMet = false;

  switch (operator) {
    case 'equals':
      conditionMet = String(fieldValue) === String(value);
      break;
    case 'contains':
      conditionMet = String(fieldValue).includes(String(value));
      break;
    case 'in':
      // Support: if selected item is in ['row_1', 'row_2', 'row_3']
      conditionMet = Array.isArray(value) && 
                     value.includes(String(fieldValue));
      break;
    case 'not_equals':
      conditionMet = String(fieldValue) !== String(value);
      break;
  }

  return {
    success: true,
    conditionMet,
    data: { conditionResult: conditionMet, evaluatedValue: fieldValue }
  };
};
```

### 4. Backend: ResponseRule & Workflow Integration

**Create association:**
```javascript
// When LIST ResponseRule is selected for workflow routing
// Store in Workflow.trigger:
{
  type: 'RESPONSE_RULE_SELECTION',
  responseRuleId: ObjectId,
  responseRuleName: String,
  listTitle: String,
  listItems: [  // Cache for quick reference
    { id: 'row_1', title: 'Rings', description: '22k' },
    { id: 'row_2', title: 'Chains', description: '22k' }
  ]
}
```

### 5. Frontend: Workflow Builder

**New Page:** `frontend/src/pages/Workflows/WorkflowBuilder.jsx`

**Features:**
- Visual canvas using React Flow
- Left sidebar: Available Response Rules (LIST only)
- Center: Flowchart visualization
- Right sidebar: Node configuration form
- Top toolbar: Save, Test, Activate, JSON toggle

**Node Types:**
```javascript
const NODE_TYPES = {
  START: {
    icon: 'Play',
    color: '#4CAF50',  // Green
    label: 'START'
  },
  DECISION: {
    icon: 'Help',
    color: '#FFC107',  // Yellow
    label: 'Selected Item?'
  },
  ACTION: {
    icon: 'Send',
    color: '#2196F3',  // Blue
    label: 'Send Response'
  },
  END: {
    icon: 'Stop',
    color: '#F44336',  // Red
    label: 'END'
  }
};
```

**Canvas Structure:**
```javascript
{
  nodes: [
    { id: 'node_start', type: 'start', position: { x: 250, y: 0 } },
    { id: 'node_cond_1', type: 'decision', position: { x: 250, y: 100 } },
    { id: 'node_action_rings', type: 'action', position: { x: 100, y: 250 } },
    { id: 'node_action_chains', type: 'action', position: { x: 400, y: 250 } },
  ],
  edges: [
    { id: 'edge_1', source: 'node_start', target: 'node_cond_1' },
    { id: 'edge_2', source: 'node_cond_1', target: 'node_action_rings', label: 'YES' },
    { id: 'edge_3', source: 'node_cond_1', target: 'node_action_chains', label: 'NO' }
  ]
}
```

### 6. Frontend: Node Configuration Form

**Decision Node Configuration:**
```
┌─────────────────────────────┐
│ Condition Configuration     │
├─────────────────────────────┤
│ Field: [listItemSelected ▼] │
│ Operator: [equals ▼]        │
│ Value: [Select Item ▼]      │
│         [1. Rings]          │
│         [2. Chains]         │
│         [3. Bracelets]      │
│                             │
│ ✓ This is the default path  │
│ (if no other conditions met)│
└─────────────────────────────┘
```

**Action Node Configuration:**
```
┌─────────────────────────────┐
│ Action Configuration        │
├─────────────────────────────┤
│ Action Type:                │
│ ◉ Send Message              │
│ ○ Send Template             │
│ ○ Trigger Workflow          │
│ ○ Human Handover            │
│                             │
│ Message:                    │
│ [Text input with vars]      │
│ {{customer_name}} available │
│ variables shown below       │
│                             │
│ [Preview] [Save]            │
└─────────────────────────────┘
```

## Data Flow Diagrams

### Flow 1: Customer Selects LIST Item

```
WhatsApp Message
    ↓
Webhook /api/webhooks/whatsapp
    ↓
parseWebhookData()
    ↓
isListSelection() → true
    ↓
extractListSelection()
    ├─ selectedItemId: "row_1"
    ├─ selectedItemTitle: "Rings"
    └─ selectedItemDescription: "22k"
    ↓
findResponseRuleFromContext()
    └─ responseRuleId: "rule_123"
    ↓
storeInConversationLog()
    ├─ interactionType: 'LIST_SELECTION'
    ├─ responseRuleId: "rule_123"
    └─ context: { selectedItemId, ... }
    ↓
triggerResponseRuleWorkflows(responseRuleId, context)
    ↓
Find workflows where:
  status = ACTIVE
  trigger.type = 'RESPONSE_RULE_SELECTION'
  trigger.responseRuleId = "rule_123"
    ↓
executeWorkflow(workflow, customer, context)
```

### Flow 2: Workflow Executes Conditional Logic

```
executeWorkflow()
    ↓
currentStep = START
    ↓
REPEAT:
  executeStep(currentStep)
    ↓
    If CONDITION:
      - Evaluate: context.selectedItemId === "row_1"
      - Result: true
      - conditionMet = true
      - nextStep = step.nextStepId
    ↓
    If ACTION:
      - Type: SEND_MESSAGE
      - Personalize template
      - Send via WhatsAppService
      - nextStep = step.nextStepId
    ↓
    currentStep = nextStep
    ↓
UNTIL: currentStep is null
    ↓
Log execution stats
```

## Database Schema Changes

### ConversationLog Addition
```javascript
{
  // ... existing fields
  responseRuleId: {
    type: ObjectId,
    ref: 'ResponseRule'
  },
  interactionContext: {
    type: {
      enum: ['LIST_SELECTION', 'BUTTON_PRESS', 'QUICK_REPLY', 'TEXT_INPUT'],
      default: 'TEXT_INPUT'
    },
    selectedItemId: String,        // For LIST selections
    selectedItemTitle: String,
    selectedItemDescription: String,
    listSectionTitle: String,
    listTitle: String,
    selectedButtonId: String,      // For BUTTONS
    selectedButtonLabel: String,
    quickReplyId: String,          // For QUICK_REPLY
    variablesContext: {}           // For variable interpolation
  }
}
```

### Workflow Trigger Update
```javascript
{
  // In Workflow.trigger
  type: 'RESPONSE_RULE_SELECTION',
  responseRuleId: ObjectId,
  responseRuleName: String,
  responseRuleType: 'LIST',  // Validate it's a LIST rule
  cachedListConfig: {
    title: String,
    sections: [{
      title: String,
      rows: [{
        id: String,
        title: String,
        description: String
      }]
    }]
  }
}
```

## API Endpoints

### New/Modified Endpoints

**1. Create Conditional Workflow**
```
POST /api/workflows/conditional
Body: {
  name: 'Collection Router',
  trigger: {
    type: 'RESPONSE_RULE_SELECTION',
    responseRuleId: 'rule_123'
  },
  steps: [...]
}
Response: { _id, status: 'DRAFT', ... }
```

**2. Get LIST Items for Workflow**
```
GET /api/response-rules/:ruleId/list-items
Response: {
  title: 'Collections',
  sections: [
    {
      title: 'Items',
      rows: [
        { id: 'row_1', title: 'Rings', description: '22k' },
        { id: 'row_2', title: 'Chains', description: '22k' }
      ]
    }
  ]
}
```

**3. Test Workflow**
```
POST /api/workflows/:workflowId/test
Body: {
  customerId: 'cust_123',
  selectedItemId: 'row_1',
  selectedItemTitle: 'Rings'
}
Response: {
  success: true,
  branchTaken: 'action_rings',
  messageToBeSent: 'Here are our rings...',
  execution: [...]
}
```

**4. Workflow Execution Stats**
```
GET /api/workflows/:workflowId/stats
Response: {
  totalExecutions: 156,
  branchStats: [
    { branchId: 'action_rings', executions: 89, percentage: 57% },
    { branchId: 'action_chains', executions: 67, percentage: 43% }
  ],
  responseTime: { avg: 245, min: 120, max: 890 }
}
```

## Error Handling

### Scenarios

1. **Workflow not found**
   - Response: Send fallback message "Unable to process selection"
   - Log: error with workflow ID

2. **No condition matches**
   - Response: Send default message or first action step
   - Log: warning with execution trace

3. **Workflow timeout (>30s)**
   - Response: Send timeout message
   - Log: error with execution context
   - Action: Escalate to human if configured

4. **Template personalization fails**
   - Response: Send template without variables
   - Log: warning with variable context

5. **WhatsApp send fails**
   - Response: Retry 3 times with exponential backoff
   - Log: error with retry count

## Testing Strategy

### Unit Tests
- CONDITION step evaluation with different operators
- Workflow trigger detection
- List item extraction from webhook
- Context passing through workflow steps

### Integration Tests
- End-to-end: User selects item → Correct response sent
- Multi-branch workflows
- Fallback paths
- Timeout handling
- Error recovery

### Load Tests
- 100 concurrent workflow executions
- Latency < 500ms for routing decision
- Memory usage stable

## Security Considerations
1. Validate responseRuleId belongs to user
2. Ensure workflow execution context doesn't leak other customers' data
3. Prevent infinite loops (max workflow depth: 5)
4. Rate limit workflow triggers per customer
5. Log all workflow executions for audit trail

## Performance Optimization
1. Cache LIST items in workflow trigger config
2. Use indexed queries for workflow lookups
3. Async workflow execution (fire-and-forget with retry)
4. Redis cache for workflow execution context
5. Batch update workflow stats every 5 minutes

## Deployment Strategy
1. Phase 1: Backend logic (webhook, workflow engine)
2. Phase 2: Test mode in workflow builder
3. Phase 3: Full visual builder with canvas
4. Phase 4: Analytics dashboard
5. Phase 5: Performance optimization & load testing

## Backwards Compatibility
- Existing workflows continue to work
- New RESPONSE_RULE_SELECTION trigger type is optional
- Existing CONDITION steps support new fields but have defaults
- ConversationLog changes are additive (new optional fields)
