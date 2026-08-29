# Bugfix Requirements Document

## Introduction

Campaign messages cannot be sent to manually created or imported customers. The system only allows campaign messages to be sent to customers who have initiated contact via webhook (e.g., when they send "hi" first). This is a critical blocker for bulk campaign operations, as users cannot send campaigns to imported customer databases or manually added customers.

The root cause is that the `appendWhatsAppOptInQuery` function in `backend/routes/campaigns.js` filters customers based on `optedIn.whatsapp: true`. When customers are created via webhook in `aiChatHandler.js`, this field is automatically set to `true`. However, when customers are manually created or imported via CSV/Excel in `customers.js`, the `optedIn` field is not initialized, causing these customers to be filtered out during campaign sending.

This bug affects all manually created customers and CSV imports, preventing legitimate bulk campaign operations.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a customer is created manually through the customer creation endpoint THEN the system does not set the `optedIn.whatsapp` field

1.2 WHEN a customer is imported via CSV/Excel upload THEN the system does not set the `optedIn.whatsapp` field

1.3 WHEN a campaign is sent to customers without the `optedIn.whatsapp` field set THEN the system filters out those customers and does not send the campaign messages

1.4 WHEN importing 1000 customers via CSV and creating a campaign for them THEN the system skips all customers and sends zero messages

### Expected Behavior (Correct)

2.1 WHEN a customer is created manually through the customer creation endpoint THEN the system SHALL set the `optedIn.whatsapp` field to `true` by default

2.2 WHEN a customer is imported via CSV/Excel upload THEN the system SHALL set the `optedIn.whatsapp` field to `true` for each imported customer

2.3 WHEN a campaign is sent to customers with `optedIn.whatsapp` set to `true` THEN the system SHALL include those customers in the campaign and send the messages successfully

2.4 WHEN importing 1000 customers via CSV and creating a campaign for them THEN the system SHALL successfully send campaign messages to all 1000 customers

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a customer is created via webhook (when they send a message first) THEN the system SHALL CONTINUE TO set `optedIn.whatsapp` to `true` automatically

3.2 WHEN a customer has explicitly opted out of WhatsApp messages THEN the system SHALL CONTINUE TO respect that opt-out and not send campaigns to them

3.3 WHEN the `appendWhatsAppOptInQuery` function filters customers for campaigns THEN the system SHALL CONTINUE TO filter based on the `optedIn.whatsapp` field

3.4 WHEN a customer is created for Instagram (via webhook with `channel: 'instagram'`) THEN the system SHALL CONTINUE TO set `optedIn.instagram: true` and `optedIn.whatsapp: false`

3.5 WHEN updating an existing customer's information THEN the system SHALL CONTINUE TO preserve their existing `optedIn` preferences

3.6 WHEN the Customer model schema defaults are applied THEN the system SHALL CONTINUE TO default `optedIn.whatsapp` to `true` as defined in the schema
