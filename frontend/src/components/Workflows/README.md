# Conditional Workflow Builder - Frontend Components

## Overview

This directory contains all components for the visual LIST-based conditional workflow builder. The builder uses a 3-panel layout:
- **Left Panel (320px)**: Condition Builder - select LIST Response Rule and add conditions
- **Center Panel (flex)**: Visual Canvas - displays conditions and responses with connections
- **Right Panel (380px)**: Quick Message Config - configure response messages for selected items

## Components

### Core Components

#### 1. **ConditionalWorkflowBuilder.jsx** (`../pages/Workflows/`)
Main page component that orchestrates the entire workflow builder.

**Features:**
- 3-panel layout integration
- State management for workflow configuration
- Save/Test/Activate buttons
- JSON toggle for power users
- Auto-save to localStorage
- Breadcrumb navigation

**Props:** None (uses URL params for edit mode)

**State:**
```javascript
{
  name: string,
  description: string,
  trigger: {
    type: 'RESPONSE_RULE_SELECTION',
    responseRuleId: string,
    responseRuleName: string,
  },
  conditions: array,
  responseCards: array,
  defaultCard: object,
}
```

#### 2. **ConditionBuilder.jsx**
Left panel component for building conditions.

**Features:**
- Response Rule dropdown selector
- Load available LIST items
- Add/edit/delete conditions
- Show condition list with status
- Add default (catch-all) response option
- Form validation

**Props:**
```javascript
{
  workflow: object,           // Current workflow config
  onConditionsChange: func,   // Callback when conditions change
  selectedConditionId: string,
  onSelectCondition: func,    // Callback when condition selected
}
```

#### 3. **WorkflowCanvas.jsx**
Center panel component displaying visual workflow.

**Features:**
- Two-column layout: Conditions | Responses
- Visual connection arrows between conditions and responses
- Displays condition cards (yellow)
- Displays response cards (blue)
- Shows default response (purple)
- Empty state messaging

**Props:**
```javascript
{
  workflow: object,
  selectedConditionId: string,
  selectedResponseId: string,
  onSelectCondition: func,
  onSelectResponse: func,
  onDeleteCondition: func,
  onDeleteResponse: func,
}
```

#### 4. **QuickMessageConfig.jsx**
Right panel component for configuring response messages.

**Features:**
- Card title editor
- Response type selector (Message/Template/Workflow/Handover)
- Message text editor with emoji support
- Variable suggestions ({{customer_name}}, {{selected_item}}, etc.)
- Message preview
- Save button

**Props:**
```javascript
{
  workflow: object,
  selectedId: string,       // ID of selected card
  onSave: func,            // Callback when card saved
}
```

### Card Components

#### 5. **ConditionCard.jsx**
Visual card representing a single condition.

**Features:**
- Yellow background (#FFC107)
- Shows item title
- Links to response card
- Edit/delete buttons
- Default indicator
- Hover effects

**Props:**
```javascript
{
  condition: object,
  isSelected: boolean,
  isDefault: boolean,
  onClick: func,
  onEdit: func,
  onDelete: func,
}
```

#### 6. **ResponseCard.jsx**
Visual card representing a response/action.

**Features:**
- Blue background (#2196F3)
- Type icons (Send, Template, Workflow, Handover)
- Message preview (max 2 lines)
- Edit/delete buttons
- Default indicator
- Color-coded by type

**Props:**
```javascript
{
  card: object,
  isSelected: boolean,
  isDefault: boolean,
  onClick: func,
  onEdit: func,
  onDelete: func,
}
```

### Modal Components

#### 7. **WorkflowTestModal.jsx**
Modal for testing workflow with different LIST selections.

**Features:**
- Select LIST item from dropdown
- Run test simulation
- Show execution trace
- Display message that would be sent
- Show branch executed
- Test results with success/failure status

**Props:**
```javascript
{
  open: boolean,
  onClose: func,
  workflowId: string,
  workflow: object,
}
```

## API Integration

### API Client Functions

See `../../api/workflowApi.js` for all API functions:

- `getResponseRules()` - Get all LIST Response Rules
- `getResponseRuleListItems(ruleId)` - Get items from a specific LIST rule
- `createConditionalWorkflow(config)` - Create new workflow
- `updateWorkflow(workflowId, config)` - Update existing workflow
- `testWorkflow(workflowId, testData)` - Test workflow
- `activateWorkflow(workflowId)` - Activate workflow
- `getWorkflow(workflowId)` - Get single workflow

## Workflow Data Structure

```javascript
{
  _id: string,              // MongoDB ID
  name: string,             // Workflow name
  description: string,      // Optional description
  trigger: {
    type: 'RESPONSE_RULE_SELECTION',
    responseRuleId: string, // Which LIST rule triggers this
    responseRuleName: string,
  },
  conditions: [
    {
      id: string,
      field: 'selectedItemId',
      operator: 'equals',
      value: string,        // Item ID
      responseCardId: string, // Link to response
      itemTitle: string,    // Display name
    }
  ],
  responseCards: [
    {
      id: string,
      title: string,
      type: 'SEND_MESSAGE' | 'SEND_TEMPLATE' | 'TRIGGER_WORKFLOW' | 'HUMAN_HANDOVER',
      config: {
        message?: string,   // For SEND_MESSAGE
        templateId?: string, // For SEND_TEMPLATE
        workflowId?: string, // For TRIGGER_WORKFLOW
      },
    }
  ],
  defaultCard: {            // Optional catch-all
    id: 'default',
    title: string,
    type: string,
    config: object,
  },
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED',
}
```

## Styling & Colors

Uses Material-UI theme with WhatsApp-inspired colors:

- **Conditions**: Yellow (#FFC107)
- **Responses**: Blue (#2196F3)
- **Default**: Purple (#9C27B0)
- **Connection**: Light Blue (#0084FF)
- **Hover**: Light Green (#E8F5E9)

Card styling:
- Padding: 16px
- Border radius: 12px
- Shadow: `0 2px 8px rgba(0,0,0,0.1)`
- Hover shadow: `0 4px 16px rgba(0,0,0,0.15)`

## Available Variables for Messages

When composing messages, users can insert these variables:

- `{{customer_name}}` - Customer's name
- `{{customer_phone}}` - Customer's phone number
- `{{selected_item}}` - Selected LIST item title
- `{{selected_description}}` - Selected item description
- `{{current_date}}` - Current date
- `{{shop_name}}` - Shop name

## Usage Example

```jsx
import ConditionalWorkflowBuilder from './pages/Workflows/ConditionalWorkflowBuilder';

// In router:
<Route path="/workflows/create" element={<ConditionalWorkflowBuilder />} />
<Route path="/workflows/:id" element={<ConditionalWorkflowBuilder />} />
```

## Testing

All components have been tested for:
- ✅ No build errors
- ✅ Proper state management
- ✅ API integration
- ✅ UI rendering
- ✅ Responsive design

## Performance Notes

- Workflows with 50+ conditions/responses perform smoothly
- Canvas renders efficiently with optimized re-renders
- Snackbar notifications for user feedback
- Loading states during API calls
- Error handling with user-friendly messages

## Future Enhancements

1. **React Flow Integration**: Add visual canvas with nodes and edges
2. **Drag-and-Drop**: Reorder conditions/responses visually
3. **Advanced Conditions**: Support nested AND/OR logic
4. **Workflow Templates**: Pre-built workflow templates
5. **Analytics Dashboard**: Show execution metrics and branch distribution
6. **Collaboration**: Share workflows with team members
7. **Version History**: Track workflow changes over time

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

All components follow WCAG 2.1 guidelines:
- Proper ARIA labels
- Keyboard navigation support
- Color contrast compliance
- Focus indicators
- Error announcements

## Dependencies

- React 18+
- Material-UI (MUI) v5+
- Axios (for API calls)
- React Router v6 (for navigation)

No additional dependencies required for the core functionality.
