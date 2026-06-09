# Renic Jewellers — WhatsApp AI Bot: Message Scenarios & Response Guide (v2)

> **Purpose:** This document covers every possible type of message a customer can send to the WhatsApp bot, what the AI should respond, known gaps/improvement areas, and the complete design image storage & customization flow.
>
> **Website:** [https://kanalli.in](https://kanalli.in)

---

## Table of Contents

1. [Language Onboarding](#1-language-onboarding)
2. [Greetings](#2-greetings)
3. [Name Sharing](#3-name-sharing)
4. [Price / Gold Rate Inquiries](#4-price--gold-rate-inquiries)
5. [Catalog & Collection Browsing](#5-catalog--collection-browsing)
6. [Category Selection](#6-category-selection)
7. [Product Selection & Ordering](#7-product-selection--ordering)
8. [Budget / Price Filtering](#8-budget--price-filtering)
9. [Customization Requests](#9-customization-requests)
10. [Design Reference Images — Storage & Usage](#10-design-reference-images--storage--usage)
11. [Delivery & Tracking](#11-delivery--tracking)
12. [Complaints & Issues](#12-complaints--issues)
13. [Consultation Booking](#13-consultation-booking)
14. [Payment Inquiries](#14-payment-inquiries)
15. [Thank You / Closing](#15-thank-you--closing)
16. [Navigation (Back / Menu)](#16-navigation-back--menu)
17. [Language Switching](#17-language-switching)
18. [Metal-Based Browsing](#18-metal-based-browsing)
19. [New In / Best Sellers / Special Collections](#19-new-in--best-sellers--special-collections)
20. [Occasion & Intent-Based Browsing](#20-occasion--intent-based-browsing)
21. [Gift-Related Messages](#21-gift-related-messages)
22. [Size & Fitting Queries](#22-size--fitting-queries)
23. [Comparison & Second Opinion Messages](#23-comparison--second-opinion-messages)
24. [Availability & Stock Queries](#24-availability--stock-queries)
25. [Offer, Discount & Scheme Inquiries](#25-offer-discount--scheme-inquiries)
26. [Return, Exchange & Warranty](#26-return-exchange--warranty)
27. [Store Location & Visiting Hours](#27-store-location--visiting-hours)
28. [Sharing & Forwarding Products](#28-sharing--forwarding-products)
29. [Out-of-Scope / Random Messages](#29-out-of-scope--random-messages)
30. [Edge Cases & Ambiguous Messages](#30-edge-cases--ambiguous-messages)
31. [Gaps & Improvement Recommendations](#31-gaps--improvement-recommendations)
32. [Full Conversation Flow](#32-full-conversation-flow)

---

## 1. Language Onboarding

The bot prompts for language selection on the **first ever message** from a new customer.

|
 Customer Sends 
|
 Expected Bot Response 
|
|
---
|
---
|
|
 Any first message (e.g. "Hi", "Hello") 
|
 Language selection menu (1–6) 
|
|
`1`
 or 
`English`
|
 Welcome in English 
|
|
`2`
 or 
`Hindi`
 / 
`हिंदी`
|
 Welcome in Hindi 
|
|
`3`
 or 
`Tamil`
 / 
`தமிழ்`
|
 Welcome in Tamil 
|
|
`4`
 or 
`Telugu`
 / 
`తెలుగు`
|
 Welcome in Telugu 
|
|
`5`
 or 
`Marathi`
 / 
`मराठी`
|
 Welcome in Marathi 
|
|
`6`
 or 
`Kannada`
 / 
`ಕನ್ನಡ`
|
 Welcome in Kannada 
|
|
 Any invalid input (e.g. 
`7`
, 
`abc`
) 
|
 "Invalid selection" + re-show menu 
|

**⚠️ Gap:** If a returning customer's `languageSelected` flag is accidentally `false` (e.g. DB reset), they will be shown the language menu again even if they have prior history. Add a check against `conversationHistory` length before re-triggering.

---

## 2. Greetings

|
 Customer Sends 
|
 Expected Bot Response 
|
|
---
|
---
|
|
`Hi`
, 
`Hello`
, 
`Hey`
, 
`Hii`
|
 If name unknown → ask for name. If known → "Welcome back, {name}!" 
|
|
`Namaste`
, 
`Vanakkam`
, 
`Namaskara`
|
 Same as above 
|
|
`Good morning`
, 
`GM`
, 
`Good evening`
|
 Same as above 
|
|
`Start`
|
 Treated as greeting — shows general welcome 
|
|
 Empty message / just a space 
|
 Treated as greeting 
|
|
`Yo`
, 
`Sup`
, 
`Wassup`
|
 Treated as informal greeting → same welcome flow 
|
|
`Is anyone there?`
, 
`Hello?`
|
 Same welcome flow 
|
|
`I need help`
|
 Welcome + show main menu options 
|

**Example Flow:**
```
Customer: Hi
Bot: Namaste! Welcome to Renic Jewellers. May I know your name, please?

Customer: Priya
Bot: Nice to meet you, Priya! Welcome to Renic Jewellers. How can we help you today?
```

---

## 3. Name Sharing

|
 Customer Sends 
|
 Expected Bot Response 
|
|
---
|
---
|
|
`My name is Priya`
|
`Nice to meet you, Priya! How can we help?`
|
|
`I am Rajesh`
|
 Same 
|
|
`This is Anita`
|
 Same 
|
|
`Call me Ravi`
|
 Same 
|
|
 Just a single word like 
`Priya`
 (2–15 chars, no known category keyword) 
|
 Treated as name → 
`Nice to meet you, Priya!`
|
|
`मेरा नाम रजेश है`
|
 Extract name → 
`Nice to meet you, Rajesh!`
|
|
`என் பெயர் பிரியா`
|
 Extract name → Tamil welcome 
|
|
`నా పేరు సురేష్`
|
 Extract name → Telugu welcome 
|

**⚠️ Gap:** Single-word name detection uses a regex check that can misfire on words like `"gold"`, `"ring"`, `"bangle"`. Recommended: expand the exclusion list or only use the explicit `"my name is"` pattern for name capture.

---

## 4. Price / Gold Rate Inquiries

### 4.1 General Rate Inquiry

|
 Customer Sends 
|
 Expected Bot Response 
|
|
---
|
---
|
|
`Gold rate`
, 
`Gold price`
, 
`Gold cost`
|
 Full rate card: 22K, 24K, Silver + custom start price 
|
|
`How much is gold?`
|
 Same 
|
|
`Today's gold rate`
|
 Same 
|
|
`Gold rate today`
|
 Same 
|
|
`What is the price of gold?`
|
 Same 
|
|
`Current gold price`
|
 Same 
|
|
`Rate`
 (alone, with gold context in prior message) 
|
 Same 
|
|
`Gold ka price`
 (Hinglish) 
|
 Same 
|

### 4.2 Specific Purity

|
 Customer Sends 
|
 Expected Bot Response 
|
|
---
|
---
|
|
`22k`
, 
`22K rate`
, 
`22 karat`
, 
`916`
, 
`91.6`
|
 Only 22K rate: 
`"Today's certified rate for 22K Gold is ₹XXXX/gram"`
|
|
`24k`
, 
`24K rate`
, 
`24 karat`
|
 Only 24K rate 
|
|
`Silver rate`
, 
`Silver price`
, 
`வெள்ளி`
, 
`चांदी`
, 
`వెండి`
|
 Only silver rate 
|
|
`18k rate`
, 
`18 karat`
|
 18K rate if available, else note not stocked 
|
|
`Hallmark gold price`
|
 Explain hallmark = 22K BIS standard → show 22K rate 
|

### 4.3 Multilingual Examples

|
 Language 
|
 Customer Sends 
|
 Response Language 
|
|
---
|
---
|
---
|
|
 Hindi 
|
`सोने का भाव`
, 
`कितने का है सोना`
|
 Hindi 
|
|
 Tamil 
|
`தங்க விலை`
, 
`இன்றைய தங்க விலை`
|
 Tamil 
|
|
 Telugu 
|
`బంగారం ధర`
, 
`ఇవాళ బంగారం రేటు`
|
 Telugu 
|
|
 Kannada 
|
`ಚಿನ್ನದ ದರ`
, 
`ಇಂದಿನ ಚಿನ್ನ ಬೆಲೆ`
|
 Kannada 
|
|
 Marathi 
|
`सोन्याचा भाव`
, 
`आजचा सोन्याचा दर`
|
 Marathi 
|

**⚠️ Gap:** The word `"gold"` alone currently triggers `detectMetalSelection()` as `GOLD` (catalog browse), but could also mean a gold rate inquiry. Recommended: run intent analysis before metal detection.

---

## 5. Catalog & Collection Browsing

### 5.1 Triggers that Show the Catalog Menu

| Customer Sends |
|---|
| `Show catalog`, `Catalog`, `Menu card`, `Menu` |
| `Show collections`, `Collections`, `Designs` |
| `What do you have?`, `Show items`, `Show pieces` |
| `I want to see jewelry` |
| `Yes`, `Sure`, `Okay`, `Please` (when asked if they want to see products) |
| `PDF`, `Brochure`, `Link` |
| `Show me something`, `Show me designs` |
| `I'm looking for jewelry` |
| `Jewellery dikhao` (Hinglish) |

**Bot Response:** Shows catalog image + prompt:
```
We offer a premium collection of jewelry designs directly from our website (https://kanalli.in/)!
Which collection would you like to explore today?

1. Women's Collection 👩
2. Men's Collection 👨
3. Gifts 🎁
```

### 5.2 All Collections Overview

| Customer Sends |
|---|
| `All collections`, `Show all`, `All designs` |
| `What else do you have?`, `More collections` |
| `Complete collection` |
| `Everything`, `Full range` |

**Bot Response:** Lists all categories (Bangles, Earrings, Rings, Necklaces, Pendants, Nose Pins, Bracelets, Chains) with website link.

---

## 6. Category Selection

### 6.1 Top-Level (Gender) Selection

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`1`
 or 
`Women`
 or 
`Women's`
|
 Shows Women's sub-menu (Bangle, Earrings, Rings, Necklace, Pendant, Nose pins) 
|
|
`2`
 or 
`Men`
 or 
`Men's`
|
 Shows Men's sub-menu (Bracelet, Chains, Rings) 
|
|
`3`
 or 
`Gifts`
 or 
`Gift`
|
 Scrapes and shows gift products directly 
|
|
`For me`
 (after asking gender) 
|
 Route to Women's or Men's based on earlier context 
|
|
`For my wife`
 / 
`For my girlfriend`
|
 Route to Women's 
|
|
`For my husband`
 / 
`For my boyfriend`
|
 Route to Men's 
|
|
`For my mom`
 / 
`For my sister`
|
 Route to Women's 
|
|
`For my dad`
 / 
`For my brother`
|
 Route to Men's 
|

### 6.2 Women's Sub-Category

|
 Customer Sends 
|
 Category Fetched 
|
|
---
|
---
|
|
`1`
 or 
`Bangle`
 / 
`Bangles`
 / 
`வளையல்`
 / 
`चूड़ी`
 / 
`ಬಳೆ`
 / 
`గాజు`
|
 Bangles from 
`product-category/women/bangle/`
|
|
`2`
 or 
`Earrings`
 / 
`Earring`
 / 
`கம்மல்`
 / 
`झुमके`
 / 
`ఓले`
|
 Earrings 
|
|
`3`
 or 
`Rings`
 / 
`Ring`
 / 
`மோதிரம்`
 / 
`अंगूठी`
 / 
`ಉಂಗುರ`
|
 Rings (prompts for Women/Men/Gifts) 
|
|
`4`
 or 
`Necklace`
 / 
`Necklaces`
 / 
`நெக்லஸ்`
 / 
`हार`
 / 
`ಹಾರ`
|
 Necklaces 
|
|
`5`
 or 
`Pendant`
 / 
`Pendants`
 / 
`பதக்கம்`
 / 
`पेंडेंट`
 / 
`ಪೆಂಡೆಂಟ್`
|
 Pendants 
|
|
`6`
 or 
`Nose pin`
 / 
`Nose pins`
 / 
`மூக்குத்தி`
 / 
`नाक`
 / 
`ಮೂಗುತಿ`
|
 Nose Pins 
|

### 6.3 Men's Sub-Category

|
 Customer Sends 
|
 Category Fetched 
|
|
---
|
---
|
|
`1`
 or 
`Bracelet`
 / 
`காப்பு`
 / 
`कंगन`
 / 
`ಕೈಕಡ`
|
 Bracelets from 
`product-category/men/bracelet-men/`
|
|
`2`
 or 
`Chain`
 / 
`Chains`
 / 
`செயின்`
 / 
`चेन`
 / 
`ಸರ`
|
 Chains from 
`product-category/men/chains/`
|
|
`3`
 or 
`Rings`
|
 Men's Rings from 
`product-category/men/rings-men/`
|

### 6.4 Special Navigation Categories

|
 Website Category 
|
 URL 
|
 Bot Support 
|
|
---
|
---
|
---
|
|
 New In 
|
`/product-category/new-in/`
|
 ❌ Not handled — see Section 19 
|
|
 Best Sellers 
|
`/product-category/best-seller/`
|
 ❌ Not handled — see Section 19 
|
|
 All Products 
|
`/product-category/all-products/`
|
 ❌ Not handled 
|

---

## 7. Product Selection & Ordering

### 7.1 Product Picking

|
 Customer Sends 
|
 Bot Action 
|
|
---
|
---
|
|
`1`
 / 
`one`
 / 
`first`
|
 Selects product 1 
|
|
`2`
 / 
`two`
 / 
`second`
|
 Selects product 2 
|
|
`3`
 / 
`three`
 / 
`third`
|
 Selects product 3 
|
|
 Product name (e.g. 
`Aurith Earring`
) 
|
 Matches by name 
|
|
`I like the first one`
|
 Selects product 1 
|
|
`Show me more about product 2`
|
 Selects product 2 for detail view 
|
|
`This one`
 (after an image) 
|
 Selects most recently shown product 
|

**Bot Response after selection:**
```
Excellent choice! You've selected *Aurith Earring* (₹3,699).

How would you like to place your order?
1. Order on Website
2. Order here in Chat
```

### 7.2 Order Options

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`1`
 / 
`online`
 / 
`website`
 / 
`web link`
|
 Sends direct product URL from kanalli.in 
|
|
`2`
 / 
`chat`
 / 
`here`
 / 
`order here`
|
 Asks for size + shipping address 
|
|
`How do I buy this?`
|
 Shows order options 1 & 2 
|
|
`I want this`
|
 Shows order options 
|
|
`Add to cart`
|
 Sends product URL (website cart) 
|
|
`Buy now`
|
 Sends product URL 
|

### 7.3 Chat Order Collection Flow

When customer chooses "Order here in Chat", bot collects in sequence:

|
 Step 
|
 Bot Asks 
|
 Customer Example Response 
|
|
---
|
---
|
---
|
|
 1 
|
 Size / variant (if applicable) 
|
`Size 6`
, 
`Medium`
, 
`2.4 inches`
|
|
 2 
|
 Full delivery address 
|
`42, Anna Nagar, Chennai - 600040`
|
|
 3 
|
 Confirm order summary 
|
`Yes confirm`
 / 
`1`
|
|
 4 
|
 Payment guidance 
|
 Bot shows UPI/payment info or admin contact 
|

### 7.4 Know More / Browse Full Collection

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Know more`
, 
`More designs`
, 
`Show all`
, 
`Browse all`
|
 Shows category link to full collection on website 
|
|
`Show more`
, 
`Any other options?`
|
 Load next 3 products in same category 
|
|
`Is this all you have?`
|
 Show full category link 
|

---

## 8. Budget / Price Filtering

### 8.1 Budget Message Formats

|
 Customer Sends 
|
 Parsed Filter 
|
|
---
|
---
|
|
`Under ₹5000`
|
 maxPrice = 5000 
|
|
`Below 3000`
|
 maxPrice = 3000 
|
|
`Less than 10k`
|
 maxPrice = 10000 
|
|
`Budget 8000`
|
 maxPrice = 8000 
|
|
`₹2000 to ₹5000`
|
 minPrice = 2000, maxPrice = 5000 
|
|
`Between 3000 and 8000`
|
 minPrice = 3000, maxPrice = 8000 
|
|
`Above 5000`
|
 minPrice = 5000 
|
|
`Starting from 10000`
|
 minPrice = 10000 
|
|
`2.5k`
|
 maxPrice = 2500 
|
|
`1 lakh`
|
 maxPrice = 100000 
|
|
`My budget is around 4000`
|
 maxPrice = 4000 
|
|
`Not too expensive, around 3k`
|
 maxPrice = 3000 
|
|
`I want something affordable`
|
 Ask: "What's your approximate budget?" 
|
|
`Cheap earrings`
|
 Ask for budget range 
|
|
`Premium necklace`
|
 Suggest ₹15,000+ range, ask to confirm 
|

### 8.2 Budget-Only Flow

If customer sends budget WITHOUT a category:
1. Bot acknowledges budget: `"Got it! Budget set to under ₹5000."`
2. Bot shows catalog menu to pick category
3. After category selected, products are filtered by budget

### 8.3 Budget With Category

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Rings under 3000`
|
 Shows rings filtered by ≤ ₹3000 
|
|
`Earrings between 2000 and 5000`
|
 Shows earrings in that range 
|
|
`Bangles above 10000`
|
 Shows bangles ≥ ₹10000 
|
|
`Necklace within 8000`
|
 maxPrice = 8000 necklaces 
|
|
`Show me chains around 5000`
|
 min=4000, max=6000 (10% tolerance on "around") 
|

**⚠️ Gap:** If no products match the budget, the bot shows cheapest available but doesn't guide the customer. Add a clearer CTA: `"No items found in that range. Would you like to see items starting from ₹X?"`

---

## 9. Customization Requests

### 9.1 Triggers

| Customer Sends |
|---|
| `I want custom jewelry`, `Custom design` |
| `Can you make a necklace for my wedding?` |
| `Bespoke ring`, `Make a bangle for me` |
| `Design a pendant for anniversary` |
| `डिज़ाइन बनाना है`, `Custom बनाना` |
| `I have a design in mind` |
| `Can I get something made to order?` |
| `I want a unique piece` |
| `Make it exactly like this` (with or without image) |
| `Personalised jewellery`, `Personalised ring` |
| `Engraving`, `Engrave my name on it` |
| `I saw a design online, can you replicate it?` |
| `My grandmother had a bangle like this, can you make one?` |

### 9.2 Customization Details Collection

Bot collects 4 details in sequence. Customer may provide one or all at once.

|
 Field 
|
 Bot Question 
|
 Customer Example Response 
|
|
---
|
---
|
---
|
|
 Occasion 
|
`What is this piece for? (wedding, daily wear, gift, anniversary, etc.)`
|
`For my wedding`
, 
`Daily use`
, 
`Birthday gift`
|
|
 Colour / Finish 
|
`Which colour or finish do you prefer? (Yellow gold, Rose gold, White gold, Matte, Polished)`
|
`Rose gold`
, 
`Yellow gold matte finish`
|
|
 Size / Measurement 
|
`What size do you need? (ring size, bangle diameter, chain length, etc.)`
|
`Ring size 16`
, 
`Bangle 2.4`
, 
`18 inch chain`
|
|
 Budget 
|
`What is your approximate budget?`
|
`Around ₹15,000`
, 
`Under 20k`
|

**Multi-field input** (customer provides all at once):
```
Customer: "Daily wear, rose gold, ring size 15, budget 8000"
Bot extracts: occasion=daily wear, color=rose gold, size=15, budget=8000
```

**Bot confirmation message:**
```
Perfect! We've noted your custom request:
1. Occasion: wedding
2. Preferred colour/finish: rose gold
3. Size: 16
4. Budget: ₹15,000

Our jewelry consultant will review and contact you shortly. 🙏
```

### 9.3 Customization with Reference Image

See Section 10 for full image handling. When an image is shared during customization:

|
 Scenario 
|
 Bot Action 
|
|
---
|
---
|
|
 Image shared before customization details 
|
 Accept as reference → continue collecting details 
|
|
 Image shared mid-customization (e.g. after occasion but before size) 
|
 Acknowledge image, store it, continue collecting remaining fields 
|
|
 Image shared after all details collected 
|
 Add to order note: "Design reference image attached" 
|
|
 Multiple images shared 
|
 Store all → label as 
`ref_image_1`
, 
`ref_image_2`
, etc. 
|

---

## 10. Design Reference Images — Storage & Usage

This section covers the **complete lifecycle** of a design image sent by a customer.

### 10.1 When is an Image a Design Reference?

|
 Scenario 
|
 Is it a Reference? 
|
 Bot Action 
|
|
---
|
---
|
---
|
|
 Image only (no text) 
|
 ✅ Yes 
|
 Accept as reference → start/continue customization flow 
|
|
 Image + 
`"Can you make this?"`
|
 ✅ Yes 
|
 Accept as reference 
|
|
 Image + 
`"Like this design"`
 / 
`"Make this"`
 / 
`"Similar to this"`
|
 ✅ Yes 
|
 Accept as reference 
|
|
 Image + 
`"I want earrings like this"`
|
 ✅ Yes 
|
 Accept as reference 
|
|
 Image + 
`"What is the rate?"`
|
 ❌ No 
|
 Respond to rate question; do NOT treat as reference 
|
|
 Image + 
`"Is this available?"`
|
 ❌ No 
|
 Respond to availability question 
|
|
 Image + unrelated text (e.g. product screenshot) 
|
 ❌ No 
|
 Respond to the text intent 
|

**Detection rule:**
```javascript
// Treat as reference if:
// (a) mediaUrl exists AND no recognized non-customization intent in text
// OR
// (b) mediaUrl exists AND text contains reference keywords
const REFERENCE_KEYWORDS = ['make this', 'like this', 'similar', 'copy', 'replicate',
  'same design', 'this design', 'this style', 'aise bana', 'ise banana',
  'इस जैसा', 'இது போல', 'ఇలాంటి', 'ಇದೇ ರೀತಿ'];
```

### 10.2 Image Storage Schema

Every design reference image must be stored in MongoDB with the following structure:

```json
{
  "_id": "ObjectId",
  "customerId": "91XXXXXXXXXX",       // WhatsApp phone number
  "customerName": "Priya",
  "referenceImages": [
    {
      "imageId": "uuid-v4",
      "mediaUrl": "https://...",        // Original WhatsApp media URL
      "storedPath": "uploads/ref/91XXXXXXXXXX/uuid.jpg",  // S3 or local
      "mimeType": "image/jpeg",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "linkedCustomizationId": "CUST-001",  // null until linked
      "label": "ref_image_1",
      "adminViewed": false,
      "adminNotes": ""
    }
  ],
  "activeCustomization": {
    "customizationId": "CUST-001",
    "occasion": "wedding",
    "color": "rose gold",
    "size": "ring size 16",
    "budget": 15000,
    "referenceImageIds": ["uuid-v4"],
    "status": "pending_review",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

### 10.3 Image Receiving Flow (Step by Step)

```
Customer sends image
        │
        ▼
1. Download image from WhatsApp media URL
   (mediaUrl expires in ~5 min — download IMMEDIATELY)
        │
        ▼
2. Save to persistent storage (S3 bucket or /uploads/ref/{phone}/)
   File name: {phone}_{timestamp}_{uuid}.jpg
        │
        ▼
3. Store metadata in MongoDB (referenceImages array)
        │
        ▼
4. Detect if reference or non-reference (see Section 10.1)
        │
        ├── Non-reference → respond to text intent normally
        │
        └── Reference → link imageId to activeCustomization
                │
                ▼
        5. Continue/start customization flow
           (collect missing fields: occasion, color, size, budget)
                │
                ▼
        6. On customization complete → notify admin with:
           - Customer name + phone
           - All customization details
           - Image URL(s) or base64 thumbnails
```

### 10.4 Image Download Code (Critical)

WhatsApp media URLs expire quickly. Download immediately on receipt:

```javascript
async function downloadAndStoreReferenceImage(mediaUrl, customerPhone) {
  // 1. Download from WhatsApp
  const response = await fetch(mediaUrl, {
    headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
  });
  const buffer = await response.buffer();

  // 2. Generate file path
  const uuid = generateUUID();
  const filename = `${customerPhone}_${Date.now()}_${uuid}.jpg`;
  const storagePath = `uploads/ref/${customerPhone}/${filename}`;

  // 3. Save to S3 (or local disk)
  await s3.putObject({
    Bucket: process.env.S3_BUCKET,
    Key: storagePath,
    Body: buffer,
    ContentType: 'image/jpeg'
  }).promise();

  // 4. Return stored path + metadata
  return {
    imageId: uuid,
    storedPath: storagePath,
    uploadedAt: new Date().toISOString()
  };
}
```

### 10.5 Admin Notification When Reference Received

When a customer sends a design reference image, notify admin via:
- WhatsApp message to admin number
- Push to admin dashboard (if exists)

```
📸 New Design Reference — Renic Jewellers

Customer: Priya (+91XXXXXXXXXX)
Occasion: Wedding
Finish: Rose gold
Size: Ring size 16
Budget: ₹15,000

🖼️ Reference image(s): [image forwarded here]

Reply to customer's WhatsApp to proceed.
```

### 10.6 Using Stored Images in Follow-up Conversations

|
 Scenario 
|
 Bot Behaviour 
|
|
---
|
---
|
|
 Customer returns after sharing image 
|
 Bot recalls: 
`"Hi Priya! We have your design reference saved. Our consultant will reach out shortly."`
|
|
 Customer asks 
`"Did you save my design?"`
|
`"Yes! We have your design reference saved (sent on [date]). Our consultant will contact you soon."`
|
|
 Customer sends a second image 
|
 Append to 
`referenceImages`
 array; link to same 
`customizationId`
|
|
 Customer says 
`"Forget that image"`
|
 Set 
`linkedCustomizationId = null`
; add note 
`"customer_removed"`
|
|
 Admin approves design and sends quote 
|
 Update 
`status = "quoted"`
 in DB; send quote to customer via bot 
|

### 10.7 Bot Responses for Image Scenarios

|
 Scenario 
|
 Bot Message 
|
|
---
|
---
|
|
 Image received (reference) 
|
`"Thank you for sharing the design! 💍 We've saved your reference. Our jewelry designer will review it and contact you shortly with options and a quote."`
|
|
 Image received + customization details still incomplete 
|
`"Beautiful design! 💍 I've saved the image. To complete your custom request, could you tell me: [missing field]?"`
|
|
 Image received (not a reference) 
|
 Respond to the text intent; do not acknowledge as reference 
|
|
 Multiple images received in one session 
|
`"Thank you for sharing these designs! 💍 We've saved all [N] references for your custom order."`
|
|
 Image download fails 
|
`"Sorry, I couldn't save the image due to a technical issue. Could you resend it? 🙏"`
|

**⚠️ Gap:** `isReferenceImageMessage()` relies on specific keywords. Add a fallback: if `mediaUrl` exists and AI intent is `customization`, treat as reference regardless of text content.

---

## 11. Delivery & Tracking

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Where is my order?`
|
 Standard 2–4 business days + ask for order number 
|
|
`Track my shipment`
|
 Same 
|
|
`Delivery status`
|
 Same 
|
|
`When will I get it?`
|
 Same 
|
|
`Order tracking`
|
 Same 
|
|
`डिलीवरी कब होगी`
|
 Hindi response 
|
|
`டெலிவரி எப்போது`
|
 Tamil response 
|
|
`My order hasn't arrived`
|
 Apologize + ask for order ID + escalate 
|
|
`It's been 7 days`
|
 Acknowledge delay + ask order number + escalate to admin 
|
|
`I need it urgently`
|
 Note urgency + ask order ID + check with admin 
|
|
`Do you deliver to [city]?`
|
 Confirm pan-India delivery or check pincode 
|
|
`Deliver to [PIN code]`
|
 Confirm serviceability 
|
|
`Express delivery available?`
|
 Share delivery options/admin contact 
|
|
`Free delivery?`
|
 Share delivery charge policy 
|

**⚠️ Gap:** Bot cannot actually track orders. For actual tracking, redirect to admin. Integrate WooCommerce order lookup by phone number (see Section 31).

---

## 12. Complaints & Issues

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`My ring is broken`
|
 Apology + ask for order details 
|
|
`The necklace is loose`
|
 Same 
|
|
`I received damaged jewelry`
|
 Same 
|
|
`Wrong product delivered`
|
 Same 
|
|
`I am disappointed`
|
 Same 
|
|
`शिकायत है`
 / 
`புகார்`
|
 Localized apology 
|
|
`The quality is bad`
|
 Empathetic apology + collect order details 
|
|
`It's not as shown in the photo`
|
 Apology + collect order ID + offer return 
|
|
`Missing item in package`
|
 Apology + ask to describe + escalate 
|
|
`Color is different`
|
 Ask for photo + order ID 
|
|
`I want a refund`
|
 Explain refund policy + collect order ID 
|
|
`I want to return this`
|
 Explain return process + collect order ID 
|
|
`The earring fell from its hook`
|
 Ask for photo + order ID + warranty check 
|
|
`Clasp is not working`
|
 Same 
|

**Complaint State Machine:**
```
Customer reports issue
        │
        ▼
Step 1: Apologize sincerely
        │
        ▼
Step 2: Ask for Order ID / Order number
        │
        ▼
Step 3: Ask customer to describe the issue clearly
        │
        ▼
Step 4: Ask for a photo of the issue (optional but recommended)
        │
        ▼
Step 5: Confirm receipt:
  "Thank you for the details. Our team will contact you within 24 hours."
        │
        ▼
Step 6: Notify admin with full complaint summary
```

**⚠️ Gap:** No follow-up state machine currently. Implement `COMPLAINT` state in bot.

---

## 13. Consultation Booking

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`I want to visit your store`
|
 Ask for preferred date and time 
|
|
`Book a consultation`
|
 Same 
|
|
`Schedule appointment`
|
 Same 
|
|
`Can I come to your shop?`
|
 Same 
|
|
`अपॉइंटमेंट बुक करना है`
|
 Hindi response 
|
|
`I want to meet your designer`
|
 Ask for date/time + note design consultation 
|
|
`Can I see the jewelry in person?`
|
 Ask for preferred date/time + share store address 
|
|
`Free consultation?`
|
 Confirm free + ask for date 
|

**Consultation Booking State Machine:**
```
Customer requests consultation
        │
        ▼
Step 1: Ask preferred date
        │
        ▼
Step 2: Ask preferred time slot (morning / afternoon / evening)
        │
        ▼
Step 3: Confirm:
  "We've noted your appointment request for [date] [time].
   Our team will confirm shortly."
        │
        ▼
Step 4: Notify admin with: name, phone, date, time, purpose
```

**⚠️ Gap:** No calendar integration or confirmation system. Collect info + notify admin manually.

---

## 14. Payment Inquiries

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`How to pay?`
|
`"We accept GPay, PhonePe, BHIM, UPI, and major debit/credit cards."`
|
|
`GPay`
, 
`PhonePe`
, 
`UPI`
|
`"Yes! We accept GPay, PhonePe, BHIM UPI, and major cards."`
|
|
`Do you accept card?`
|
`"Yes, we accept major debit and credit cards."`
|
|
`Bank transfer`
, 
`NEFT`
|
 Show admin contact for NEFT details 
|
|
`COD`
, 
`Cash on delivery`
|
`"COD is available for select orders. Please contact us to confirm."`
 → Admin contact 
|
|
`Payment number`
|
 Admin UPI ID / contact number 
|
|
`EMI available?`
|
`"Please contact us directly for EMI options."`
 → Admin contact 
|
|
`Pay in installments?`
|
 Same 
|
|
`Is the payment secure?`
|
`"Yes, payments on kanalli.in are fully secured."`
|
|
`Discount on payment method?`
|
 Check and confirm any active offers → else admin contact 
|

**⚠️ Gap:** Currently redirects ALL payment questions to admin. Answer basic questions directly (GPay, card acceptance) and only send to admin for transaction-specific queries.

---

## 15. Thank You / Closing

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Thank you`
, 
`Thanks`
, 
`TQ`
, 
`Thank u`
|
`"You're very welcome! If you need anything else, we're always here. 🙏"`
|
|
`Dhanyawad`
 / 
`Shukriya`
|
 Hindi: 
`"आपका बहुत-बहुत स्वागत है!"`
|
|
`நன்றி`
|
 Tamil response 
|
|
`ధన్యవాదాలు`
|
 Telugu response 
|
|
`Bye`
, 
`Goodbye`
, 
`See you`
|
`"Thank you for visiting Renic Jewellers! Have a great day. 💍"`
|
|
`Take care`
|
 Same warm closing 
|
|
`Will contact later`
|
`"Of course! We'll be here whenever you need us. 😊"`
|
|
`That's all I needed`
|
`"Wonderful! Hope we could help. Do visit us again. 🙏"`
|

---

## 16. Navigation (Back / Menu)

|
 Customer Sends 
|
 Bot Action 
|
|
---
|
---
|
|
`Back`
|
 Returns to previous menu level 
|
|
`Go back`
|
 Same 
|
|
`Previous`
|
 Same 
|
|
`Menu`
|
 Returns to top catalog menu 
|
|
`Home`
|
 Returns to top menu 
|
|
`Start over`
|
 Returns to top welcome menu 
|
|
`पीछे`
 / 
`வாபஸ்`
 / 
`వెనుకకు`
 / 
`ಹಿಂದಕ್ಕೆ`
|
 Localized back navigation 
|
|
`Main menu`
|
 Top-level catalog menu 
|

**Back Navigation Path:**
```
Product Detail → Products List → Sub-Category Menu → Top Menu (Collections)
```

---

## 17. Language Switching

|
 Customer Sends 
|
 Bot Action 
|
|
---
|
---
|
|
`Change language`
|
 Resets language flag + shows language menu 
|
|
`Switch language`
|
 Same 
|
|
`Language`
|
 Same 
|
|
`भाषा बदलें`
 / 
`மொழி மாற்று`
 / 
`భాష మార్చండి`
 / 
`ಭಾಷೆ ಬದಲಾಯಿಸಿ`
|
 Same 
|
|
`Speak in Hindi`
 / 
`Hindi mein bolo`
|
 Switch to Hindi 
|
|
`Reply in Tamil`
|
 Switch to Tamil 
|
|
`English please`
|
 Switch to English 
|

---

## 18. Metal-Based Browsing

|
 Customer Sends 
|
 Bot Action 
|
|
---
|
---
|
|
`Show gold jewelry`
|
 Searches catalog for gold items 
|
|
`Gold`
 (without rate context) 
|
 Same 
|
|
`Silver jewelry`
|
 Searches for silver items 
|
|
`Platinum jewelry`
|
 Searches for platinum items 
|
|
`Rose gold jewelry`
|
 Filter by rose gold 
|
|
`White gold`
|
 Filter by white gold 
|
|
`I want something in silver`
|
 Route to silver category 
|
|
`Only gold pieces`
|
 Filter to gold items 
|

**⚠️ Gap:** `detectMetalSelection` checks for `"gold"` but `"I want gold earrings"` should go to catalog, not rate inquiry. Test this edge case explicitly.

---

## 19. New In / Best Sellers / Special Collections

|
 Customer Sends 
|
 Ideal Response 
|
 Current Behavior 
|
|
---
|
---
|
---
|
|
`New arrivals`
|
 Show new-in products 
|
 Shows general catalog prompt ❌ 
|
|
`What's new?`
|
 Show new-in products 
|
 Shows general catalog prompt ❌ 
|
|
`Latest designs`
|
 Show new-in products 
|
 Shows general catalog prompt ❌ 
|
|
`Best sellers`
|
 Show best seller products 
|
 General catalog or fallback ❌ 
|
|
`Most popular`
|
 Show best sellers 
|
 General catalog ❌ 
|
|
`Trending jewelry`
|
 Show best sellers 
|
 General catalog ❌ 
|
|
`Show all products`
|
 All products page 
|
 General catalog ❌ 
|
|
`Recently launched`
|
 New in products 
|
 Not handled ❌ 
|
|
`Hot selling`
|
 Best sellers 
|
 Not handled ❌ 
|

**Recommended Fix — `detectCategorySelection`:**
```javascript
if (['new in','new arrivals',"what's new",'latest','recently launched','new collection']
    .some(k => text.includes(k))) return 'NEW_IN';

if (['best seller','bestseller','popular','trending','hot selling','top selling']
    .some(k => text.includes(k))) return 'BEST_SELLER';

if (['all products','show all','everything'].some(k => text.includes(k))) return 'ALL_PRODUCTS';
```

**Recommended Fix — `getCategoryPath`:**
```javascript
if (subUpper === 'NEW_IN') return 'product-category/new-in/';
if (subUpper === 'BEST_SELLER') return 'product-category/best-seller/';
if (subUpper === 'ALL_PRODUCTS') return 'product-category/all-products/';
```

---

## 20. Occasion & Intent-Based Browsing

Customers often describe their occasion rather than a category. Bot should map these to the right category or ask a clarifying question.

|
 Customer Sends 
|
 Mapped Intent 
|
 Bot Action 
|
|
---
|
---
|
---
|
|
`Wedding jewelry`
|
 Bridal — show necklace/bangle/earring set 
|
 Ask: Women's or Men's? 
|
|
`Engagement ring`
|
 Rings 
|
 Route to rings category 
|
|
`Anniversary gift`
|
 Gifts / custom 
|
 Show gifts or ask for customization 
|
|
`Birthday gift for wife`
|
 Women's jewelry 
|
 Route to Women's collection 
|
|
`Office wear jewelry`
|
 Lightweight daily wear 
|
 Show earrings, pendants 
|
|
`Temple jewelry`
|
 Traditional heavy pieces 
|
 Show necklace, bangle 
|
|
`Bridal set`
|
 Multi-piece set 
|
 Show necklace + earring sets or ask for custom 
|
|
`Something for daily use`
|
 Lightweight items 
|
 Show pendants, small earrings 
|
|
`Party wear jewelry`
|
 Statement pieces 
|
 Show bold earrings, necklaces 
|
|
`Baby shower gift`
|
 Gifts 
|
 Route to Gifts 
|
|
`Maternity gift`
|
 Same 
|
 Route to Gifts 
|
|
`Retirement gift`
|
 Same 
|
 Route to Gifts 
|
|
`Graduation gift`
|
 Same 
|
 Route to Gifts 
|

---

## 21. Gift-Related Messages

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`I want to buy a gift`
|
 Ask: For whom? (mom, wife, friend, etc.) 
|
|
`Gift for wife`
|
 Show Women's jewelry with gift suggestion 
|
|
`Gift for mom`
|
 Same 
|
|
`Gift under ₹3000`
|
 Set budget filter → show Gifts/Women's collection 
|
|
`Birthday present`
|
 Ask: For whom + budget? 
|
|
`Anniversary gift for husband`
|
 Route to Men's collection 
|
|
`Do you have gift wrapping?`
|
 Confirm gift wrapping availability → admin for details 
|
|
`Can you send with a note?`
|
 Confirm personalised note service → admin for details 
|
|
`Gift card`
, 
`Voucher`
|
 Inform if available or redirect to admin 
|
|
`Something special`
|
 Ask: For whom + occasion + budget 
|

---

## 22. Size & Fitting Queries

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`How to find my ring size?`
|
 Explain ring size guide (mm / Indian size chart) 
|
|
`What is standard bangle size?`
|
 Explain standard sizes (2.4, 2.6, 2.8) + how to measure 
|
|
`My ring size is 16`
|
 Store size in session → use in order/customization 
|
|
`Size 18 available?`
|
 Route to stock check → admin if unavailable 
|
|
`Is this adjustable?`
|
 Mention if product is adjustable or fixed size 
|
|
`Chain length — how long?`
|
 Explain standard lengths (16", 18", 22") + show options 
|
|
`Can you resize it?`
|
 Confirm if resizing is offered → admin for details 
|
|
`I don't know my size`
|
 Offer size guide link or consultation 
|

**Bot Size Guide Response (Ring):**
```
To find your ring size:
1. Wrap a thin strip of paper around your finger
2. Mark where it meets
3. Measure the length in mm
4. Use this chart:
   - 46mm → Size 6 (Indian 6)
   - 49mm → Size 8
   - 51mm → Size 9
   - 54mm → Size 12
   - 57mm → Size 16

For accurate sizing, visit us in-store for a free fitting! 💍
```

---

## 23. Comparison & Second Opinion Messages

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Which is better — 22K or 24K?`
|
 Explain: 22K = stronger for jewelry, 24K = pure but softer 
|
|
`Gold vs silver jewelry`
|
 Explain both options based on usage 
|
|
`Which one should I buy?`
 (after seeing 3 products) 
|
 Ask for preference (occasion, style, budget) + recommend 
|
|
`What's the difference between these two?`
|
 Compare selected products by price and design 
|
|
`Is this worth the price?`
|
 Affirm value, mention hallmark/purity 
|
|
`Is this genuine gold?`
|
 Explain BIS hallmark certification 
|
|
`How do I know it's real?`
|
 Same 
|
|
`Other shops have it cheaper`
|
 Explain quality/hallmark difference politely; don't price-match aggressively 
|

---

## 24. Availability & Stock Queries

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Is this available?`
|
 Route to product page or ask admin 
|
|
`Do you have this in stock?`
|
 Same 
|
|
`Is size 7 ring available?`
|
 Check product variants or redirect to admin 
|
|
`When will it be back in stock?`
|
 Admin contact 
|
|
`Out of stock?`
|
 Confirm + offer similar alternatives 
|
|
`Only one left?`
|
 Admin contact for live stock 
|
|
`Can I pre-order?`
|
 Admin contact 
|
|
`Is this available in rose gold?`
|
 Route to variant check or admin 
|

**⚠️ Gap:** Bot cannot query live WooCommerce stock. Add WooCommerce REST API stock check (see Section 31).

---

## 25. Offer, Discount & Scheme Inquiries

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Any discounts?`
|
 Show active offers if configured; else 
`"Please contact us for current promotions."`
|
|
`Sale on?`
|
 Same 
|
|
`Coupon code`
|
 If coupon system exists → share code; else admin 
|
|
`Making charges offer?`
|
 Admin contact 
|
|
`Exchange offer?`
|
 Explain exchange policy or admin contact 
|
|
`Gold scheme`
, 
`Monthly savings scheme`
|
 Explain if applicable or admin contact 
|
|
`Festival offer`
, 
`Akshaya Tritiya offer`
|
 Seasonal promo if configured, else admin 
|
|
`Loyalty discount`
|
 Admin contact 
|
|
`First purchase discount`
|
 If offer exists → share; else admin 
|
|
`Refer a friend discount`
|
 If program exists → share; else admin 
|

---

## 26. Return, Exchange & Warranty

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Can I return this?`
|
 Explain return policy (e.g., 7-day return for defective items) 
|
|
`Exchange policy?`
|
 Explain exchange terms 
|
|
`I want to exchange my old gold`
|
 Explain gold exchange/buyback policy + admin contact 
|
|
`Warranty on jewelry?`
|
 Explain warranty terms (e.g., 1 year on making defects) 
|
|
`My jewelry turned black`
|
 Ask for details + escalate 
|
|
`Hallmark certificate?`
|
 Confirm BIS hallmark + how to get certificate 
|
|
`Do you take back old jewelry?`
|
 Explain buyback policy + admin contact 
|
|
`Can I upgrade?`
|
 Explain upgrade/exchange policy + admin contact 
|

---

## 27. Store Location & Visiting Hours

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Where are you located?`
|
 Share store address 
|
|
`Your address?`
|
 Same 
|
|
`What time do you open?`
|
 Share store timings 
|
|
`Are you open today?`
|
 Share day-wise timings or confirm open/closed 
|
|
`Do you have a shop I can visit?`
|
 Confirm yes + share address 
|
|
`Is parking available?`
|
 Share info if available 
|
|
`How to reach you?`
|
 Share address + Google Maps link 
|
|
`Near me?`
|
 Ask for their city/area + share nearest store info 
|
|
`ಅಂಗಡಿ ಎಲ್ಲಿದೆ`
|
 Kannada: share store address 
|

---

## 28. Sharing & Forwarding Products

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Share this product`
|
 Send product URL 
|
|
`Send me the link`
|
 Send product URL 
|
|
`I want to show this to my husband`
|
 Send product URL 
|
|
`Can I forward this to someone?`
|
 Send product URL 
|
|
`Send catalog link`
|
 Send website URL: kanalli.in 
|
|
`WhatsApp this to me`
|
 Confirm it's already in chat → re-send link if needed 
|
|
`Save for later`
|
 Acknowledge + confirm customer can revisit; offer to note it 
|

---

## 29. Out-of-Scope / Random Messages

These are messages that fall outside jewelry or order intent. Bot should handle gracefully.

|
 Customer Sends 
|
 Bot Response 
|
|
---
|
---
|
|
`Tell me a joke`
|
`"Ha! I'm better at rings than jokes 😄. Can I help you find something beautiful today?"`
|
|
`What is 2+2?`
|
`"4! But more importantly, can I help you find the perfect jewelry? 💍"`
|
|
`Who are you?`
|
`"I'm the Renic Jewellers virtual assistant. I'm here to help you explore our collection, check gold rates, and place orders!"`
|
|
`Are you a robot?`
|
`"I'm an AI assistant for Renic Jewellers. I can help with jewelry, prices, and orders. How can I assist you today?"`
|
|
`I'm bored`
|
`"Let me cheer you up with some beautiful jewelry! 😊 Want to browse our collection?"`
|
|
 Long irrelevant text / spam 
|
 Politely redirect: 
`"I can best help you with jewelry queries. What are you looking for today?"`
|
|
 Abusive language 
|
`"We're here to help. Please feel free to ask about our jewelry. 🙏"`
 (no escalation of tone) 
|
|
 Voice note (no text) 
|
 Treat as greeting → welcome message 
|
|
 Sticker 
|
 Treat as greeting → welcome message 
|
|
 Forwarded news / link 
|
 Ignore content, respond as greeting 
|

---

## 30. Edge Cases & Ambiguous Messages

|
 Customer Sends 
|
 Risk 
|
 Recommendation 
|
|
---
|
---
|
---
|
|
`5`
 (while at Women's sub-menu) 
|
 Could be Pendant OR budget 
|
 State machine correctly handles — OK 
|
|
`gold`
 alone 
|
 Metal browse vs rate inquiry 
|
 Current guard mostly works; test 
`"I like gold"`
|
|
`ring`
 alone 
|
 Category or sentence fragment 
|
 Correctly routes to RINGS — OK 
|
|
 A single number 
`3000`
|
 Budget filter 
|
 Correctly parsed as maxPrice = 3000 if ≥ 100 
|
|
`ok`
|
 Confirmation to show catalog 
|
 Routes to catalog (saysYes = true) — verify desired 
|
|
 Long mixed message with budget + category 
|
`"Show earrings under 5000"`
|
 Correctly handled 
|
|
 Mixed language (Hinglish) 
|
`"Mujhe gold rings dikhao"`
|
`"rings"`
 detected; 
`"dikhao"`
 not a trigger — partially OK 
|
|
 Emojis only 
|
`"💍"`
|
 Add emoji → category detection 
|
|
`"💍"`
|
 Falls to general inquiry 
|
 Map 
`💍`
 → rings, 
`📿`
 → necklace, 
`⭕`
 → bangles 
|
|
 Voice note (no text) 
|
 Empty string 
|
 Treated as greeting — acceptable 
|
|
 Image + rate inquiry 
|
 Could be misclassified as reference 
|
 Check text intent BEFORE treating as reference 
|
|
 Customer says a product name without context 
|
`"Aurith earring"`
|
 Search products by name → show match 
|
|
 Customer resends old image 
|
 Duplicate reference 
|
 Check by hash before storing 
|

---

## 31. Gaps & Improvement Recommendations

### Critical Fixes

|
#
|
 Issue 
|
 Fix 
|
|
---
|
---
|
---
|
|
 1 
|
**
New In / Best Seller
**
 categories not routed 
|
 Add 
`NEW_IN`
, 
`BEST_SELLER`
, 
`ALL_PRODUCTS`
 to 
`detectCategorySelection`
 and 
`getCategoryPath`
|
|
 2 
|
**
Complaint flow
**
 has no follow-up state machine 
|
 Add 
`COMPLAINT`
 state: collect order ID → description → photo 
|
|
 3 
|
**
Single-word name detection
**
 fires on jewelry keywords 
|
 Expand exclusion keyword list significantly 
|
|
 4 
|
**
Payment FAQ
**
 always redirects to admin 
|
 Answer basic questions directly; reserve admin for transactions 
|
|
 5 
|
**
WhatsApp media URL expires
**
 — images not downloaded immediately 
|
 Download image immediately on receipt; store to S3/disk 
|
|
 6 
|
**
Reference image
**
 misclassification 
|
 Run AI intent analysis on message text before classifying as reference 
|

### Enhancements

|
#
|
 Enhancement 
|
 Details 
|
|
---
|
---
|
---
|
|
 7 
|
**
Emoji detection
**
|
 Map 
`💍`
 → rings, 
`📿`
 → necklace/chains, 
`⭕`
 → bangles 
|
|
 8 
|
**
Order tracking
**
|
 Integrate WooCommerce order lookup by phone number 
|
|
 9 
|
**
Wishlist / Save for later
**
|
 Let customers save designs they like 
|
|
 10 
|
**
Share to others
**
|
 Let customers forward a product link to a friend 
|
|
 11 
|
**
Consultation confirmation
**
|
 After date/time collected, send confirmation + notify admin 
|
|
 12 
|
**
Product search by name
**
|
`"Do you have Aurith earring?"`
 → search products by name 
|
|
 13 
|
**
Stock check
**
|
`"Is this in size 16?"`
 → query WooCommerce stock API 
|
|
 14 
|
**
Offer / Discount inquiries
**
|
`"Any discounts?"`
 → show current offers from CMS 
|
|
 15 
|
**
Daily wear vs bridal intent routing
**
|
 Pre-filter by price range based on occasion keyword 
|
|
 16 
|
**
Repeat customer recognition
**
|
 If 
`totalPurchases > 0`
, show personal welcome + last category 
|
|
 17 
|
**
Multiple reference images
**
|
 Store all images; link to one customization request 
|
|
 18 
|
**
Admin image notification
**
|
 Forward reference image to admin WhatsApp automatically 
|
|
 19 
|
**
Duplicate image detection
**
|
 Hash images before storing; skip duplicates 
|
|
 20 
|
**
Customization status tracking
**
|
 Customer can ask 
`"What happened to my custom order?"`
 → query DB 
|

### Reliability Improvements

|
#
|
 Area 
|
 Recommendation 
|
|
---
|
---
|
---
|
|
 21 
|
**
Scraper resilience
**
|
 Add JSON-LD structured data extraction as fallback 
|
|
 22 
|
**
Rate limit handling
**
|
 Alert admin when Gemini quota is near exhaustion 
|
|
 23 
|
**
Language detection accuracy
**
|
 Test Hinglish extensively; expand mixed-language patterns 
|
|
 24 
|
**
State cleanup
**
|
 Auto-expire idle catalog states after 30 minutes 
|
|
 25 
|
**
Duplicate scrape prevention
**
|
 Add 5-min cache for 
`scrapeProductsFromUrl`
 results 
|
|
 26 
|
**
Timeout handling
**
|
 Show fallback message with category URL if scraper times out 
|
|
 27 
|
**
S3 / storage failure handling
**
|
 If image storage fails, retry once; notify admin on persistent failure 
|
|
 28 
|
**
Media URL expiry
**
|
 Always download WhatsApp media within 60 seconds of receipt 
|

---

## 32. Full Conversation Flow

```
Customer sends first message
        │
        ▼
Language already selected?
   No → Show language menu (1-6) → Customer picks → Welcome in chosen language
   Yes ↓
        │
Customer sends message
        │
        ├── Greeting / Hi / Hello
        │       └── Name known? → Welcome back | Unknown → Ask name
        │
        ├── Price inquiry (rate, gold, silver, 22k, 24k)
        │       └── Specific purity? → Single rate | General → Full rate card
        │
        ├── Catalog / Designs / Collections
        │       └── Top menu: 1=Women, 2=Men, 3=Gifts
        │               └── Sub-menu → Category → Products (3 shown)
        │                       └── Pick product 1/2/3
        │                               └── 1=Website link | 2=Order in chat
        │                                       └── 2 → Collect size → address → confirm
        │
        ├── Budget filter (under X / between X-Y)
        │       └── No category? → Acknowledge + show menu
        │       └── With category? → Filter products shown
        │
        ├── Occasion / Gift / Intent based
        │       └── Map to category + budget + gender → show filtered products
        │
        ├── Customization request (text)
        │       └── Collect: Occasion → Color → Size → Budget → Confirm → Notify admin
        │
        ├── Design image shared
        │       ├── Is reference image? (check intent)
        │       │       └── Yes → Download immediately → Store → Collect missing customization fields
        │       │                       └── All fields complete → Confirm + Notify admin with image
        │       └── Not reference → respond to text intent
        │
        ├── New In / Best Sellers
        │       └── Scrape new-in / best-seller category → show 3 products
        │
        ├── Complaint
        │       └── Apologize → Collect: Order ID → Issue description → Photo → Notify admin
        │
        ├── Delivery inquiry
        │       └── Standard timeline info or order ID → escalate if delayed
        │
        ├── Size / Fitting query
        │       └── Show size guide or collect size for order
        │
        ├── Payment inquiry
        │       └── Basic (GPay/card?) → Answer directly
        │       └── Transactional → Admin contact
        │
        ├── Return / Exchange / Warranty
        │       └── Explain policy → Admin contact for action
        │
        ├── Store location / hours
        │       └── Share address + timings
        │
        ├── Thank you / Bye
        │       └── Warm closing
        │
        └── Unknown / Unhandled
                └── Gemini AI general response | Fallback: general_inquiry
```

---

*Document v2 — Renic Jewellers WhatsApp AI Bot — `aiMessageAnalyzer.js`*
*Website: https://kanalli.in | Supported languages: English, Hindi, Tamil, Telugu, Marathi, Kannada*
*Last updated: June 2026*