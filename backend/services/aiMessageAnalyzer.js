// renic-automation-backend/services/aiMessageAnalyzer.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');

const LOCALIZATIONS = {
  en: {
    welcome_back: "Welcome back, {name}! How can we assist you today at Renic Jewellers?",
    greeting_unknown: "Namaste! Welcome to Renic Jewellers. May I know your name, please?",
    nice_to_meet_you: "Nice to meet you, {name}! Welcome to Renic Jewellers. How can we help you today?",
    thank_you: "You're very welcome{namePart}! If you need anything else or want to explore our collections, feel free to ask. Have a wonderful day! 💎",
    price_inquiry: "Our customized jewelry pieces start from ₹{customStartPrice}. Today's certified rates are:\n- *22K Gold*: ₹{gold22}/gram\n- *24K Gold*: ₹{gold24}/gram\n- *Silver*: ₹{silver}/gram\n\nWhat piece can I assist you with today?",
    price_inquiry_22k: "Today's certified rate for *22K Gold* is ₹{gold22}/gram. What piece can I assist you with today?",
    price_inquiry_24k: "Today's certified rate for *24K Gold* is ₹{gold24}/gram. What piece can I assist you with today?",
    price_inquiry_silver: "Today's certified rate for *Silver* is ₹{silver}/gram. What piece can I assist you with today?",
    customization: "We specialize in bespoke bridal and luxury jewelry designs. Let me know your occasion, budget, and design ideas to schedule a free design consultation!",
    complaint: "We sincerely apologize for any inconvenience. Please share your order details and the issue, and our team will resolve it immediately.",
    purchase_intent: "Excellent choice! You can order in two ways:\n\n1. *Order online*: Reply with \"1\" to get the website link to checkout directly.\n2. *Order here*: Reply with \"2\" to order directly in the chat.\n\nWhich option do you prefer?",
    delivery_query: "Standard delivery takes 2-4 business days across India. Please provide your order number to track your shipment.",
    consultation_booking: "We'd love to schedule a consultation or store visit for you. What date and time works best?",
    general_inquiry: "Hello! Welcome to Renic Jewellers. How can we help you find the perfect jewelry piece today?",
    admin_contact: "For payment-related, order status, or direct inquiries, please contact our administrator directly at:\n📞 {phone}\n\nThey will be happy to assist you! 💎",
    product_selected: "Excellent choice! You've selected *{name}* ({price}).\n\nHow would you like to place your order?\n\n1. *Order on Website*: Reply \"1\" to get the link to check out directly.\n2. *Order here in Chat*: Reply \"2\" to place the order here.\n\nPlease reply with \"1\" or \"2\" to proceed!",
    option_1_checkout: "Here is the link to checkout and order *{name}* directly on our website:\n🔗 {productUrl}\n\nHappy shopping! 💍",
    option_2_checkout: "Great! I will help you place your order for *{name}* ({price}) here in the chat. 💍\n\nPlease reply with:\n1. Your size (if applicable)\n2. Your shipping address\n\nOnce you provide these details, I will help you book it!",
    option_1_category: "Here is the link to view and order{catName} on our website:\n🔗 {categoryUrl}\n\nHappy shopping! 💍",
    option_2_category: "Great! I will help you place your order here in the chat. 💍\n\nPlease reply with:\n1. The design name or share its image\n2. Your size (if applicable)\n3. Your shipping address\n\nOnce you provide these details, I will help you book it!",
    metal_search_header: "Here are some of our featured *{metal}* designs! 💍✨",
    metal_search_empty: "We offer a beautiful collection of *{metal}* jewelry directly on our website! 💍✨\n\nYou can explore all our latest designs, collections, and rates here:\n🔗 {searchUrl}\n\nLet me know if you would like help customizing or booking a design consultation!",
    catalog_prompt: "We offer a premium collection of jewelry designs directly from our website (https://kanalli.in/)! Which collection would you like to explore today?\n\n1. Women's Collection 👩\n2. Men's Collection 👨\n3. Gifts 🎁\n\nPlease reply with the number or name of the collection you want to see!",
    category_header: "Here are some of our featured *{category}* from our website! 💍✨",
    category_empty: "We offer a beautiful collection of *{category}* directly on our website! 💍✨\n\nYou can explore all our latest designs directly here:\n🔗 {categoryUrl}\n\nLet me know if you would like help customizing or booking a design consultation!",
    womens_submenu: "👩 *Women's Collection* 👩\nWhich category would you like to explore?\n\n1. Bangle ⭕\n2. Earrings 💎\n3. Rings 💍\n4. Necklace 📿\n5. Pendant 🎗️\n6. Nose pins 📍\n\nPlease reply with the number or name of the category!\n(Type *back* to return to the previous menu)",
    mens_submenu: "👨 *Men's Collection* 👨\nWhich category would you like to explore?\n\n1. Bracelet 📿\n2. Chains ⛓️\n3. Rings 💍\n\nPlease reply with the number or name of the category!\n(Type *back* to return to the previous menu)",
    product_caption: "*{idx}. {name}*\n💰 Price: {price}\n🔗 View details: {productUrl}",
    product_footer: "Above are the featured *{subcategory}*.\n\nReply with the product number (*1*, *2*, or *3*) to get ordering options, type *back* to return to categories, or *know more* to browse all {subcategory} designs! 🛍️",
    rings_gender_prompt: "Would you like to see rings for:\n1. Women 👩\n2. Men 👨\n3. Gifts 🎁\n\nPlease reply with *1*, *2*, or *3*!",
    budget_match: "Here are some of our featured *{category}* under ₹{maxPrice}! 💍✨",
    budget_range_match: "Here are some of our featured *{category}* between ₹{minPrice} and ₹{maxPrice}! 💍✨",
    budget_above_match: "Here are some of our featured *{category}* starting from ₹{minPrice}! 💍✨",
    budget_empty: "We couldn't find any *{category}* under ₹{maxPrice}. Our closest designs start from {minAvailablePrice}. Would you like to see those options?",
    budget_range_empty: "We couldn't find any *{category}* in that range. Our closest designs start from {minAvailablePrice}. Would you like to see those options?",
    budget_set: "Got it! Budget set to under ₹{maxPrice}.",
    budget_set_range: "Got it! Budget set between ₹{minPrice} and ₹{maxPrice}.",
    budget_set_above: "Got it! Budget set starting from ₹{minPrice}.",
    customization_reference: "Thank you for sharing the design image! 💍 Our jewelry designer will review this reference to customize your piece and get back to you shortly with design options and quotes.",
    know_more_prompt: "Would you like to explore more designs in this category? 🔍\n\n🔗 Browse full {category} collection here:\n{categoryUrl}\n\nReply with:\n- *next* or *more* to see more from this category\n- *back* to return to menu\n- A product number (1, 2, 3) to order",
    all_collections: "Here are all our collections:\n\n👩 *Women's Collection*: Bangles, Earrings, Rings, Necklaces, Pendants, Nose Pins\n👨 *Men's Collection*: Bracelets, Chains, Rings\n🎁 *Gift Collection*: Special occasion pieces\n\n🔗 Browse all collections: {collectionsUrl}\n\nReply with the collection name or number to explore!\n(1. Women | 2. Men | 3. Gifts)",
    more_collections_prompt: "Want to see more from our collection? 📦\n\nHere's where you can explore everything:\n🔗 {collectionsUrl}\n\nOr let me know what you're looking for and I'll help you find it!",
    show_more_catalog: "You can explore our full jewelry collection here:\n🔗 {collectionsUrl}\n\nYou can also reply with *rings*, *earrings*, *bangles*, *necklace*, *pendant*, *chains*, or *bracelet* and I will show the matching designs.",
    identity_response: "I'm the Renic Jewellers virtual assistant. I can help you explore collections, check gold rates, customize designs, and place orders.",
    joke_response: "Ha! I'm better at rings than jokes 😄 Can I help you find something beautiful today?",
    random_redirect: "I can best help you with jewelry queries. What are you looking for today: rings, earrings, bangles, necklace, chains, or a custom design?",
    size_guide_ring: "To find your ring size, wrap a thin strip of paper around your finger, mark where it meets, then measure the length in mm. Share the measurement with us and we will guide you to the right size.",
    location_info: "You can visit us at:\n📍 {address}\n\nStore hours: {hours}\n\nPlease message before visiting so our team can confirm availability.",
    policy_info: "{policy}\n\nFor exchange, warranty, or return action on an existing order, please contact us at {phone}.",
    offer_info: "Please contact us for current offers, discounts, making-charge schemes, or festival promotions:\n📞 {phone}",
    stock_info: "For live stock or size availability, please share the product name or link. Our team can confirm the latest availability for you.",
    comparison_info: "For jewelry, *22K gold* is usually better for daily wear because it is stronger. *24K gold* is purer but softer, so it is not ideal for most jewelry pieces.",
    payment_options_info: "Yes, we accept GPay, PhonePe, BHIM UPI, and major debit/credit cards. Payments on kanalli.in are secure.",
    cod_info: "COD is available for select orders. Please contact us at {phone} so our team can confirm it for your order.",
    payment_admin_info: "For payment number, bank transfer, NEFT, EMI, or installment details, please contact us directly:\nðŸ“ž {phone}",
    vague_budget_prompt: "Sure. What is your approximate budget? You can say something like *under â‚¹5,000* or *â‚¹5,000 to â‚¹10,000*.",
    gift_help_prompt: "Absolutely. Who is the gift for, and what budget should we keep in mind?",
    gift_service_info: "Gift wrapping and personalised notes may be available for select orders. Please contact us at {phone} to confirm for your item.",
    closing_response: "Thank you for visiting Renic Jewellers! We will be here whenever you need help finding something beautiful."
  },
  hi: {
    welcome_back: "स्वागत है, {name}! आज हम रेनिक ज्वेलर्स में आपकी क्या सहायता कर सकते हैं?",
    greeting_unknown: "नमस्ते! रेनिक ज्वेलर्स में आपका स्वागत है। क्या मैं आपका नाम जान सकता हूँ?",
    nice_to_meet_you: "आपसे मिलकर अच्छा लगा, {name}! रेनिक ज्वेलर्स में आपका स्वागत है। आज हम आपकी क्या सहायता कर सकते हैं?",
    thank_you: "आपका बहुत-बहुत स्वागत है{namePart}! यदि आपको कुछ और चाहिए या आप हमारे संग्रह को देखना चाहते हैं, तो बेझिझक पूछें। आपका दिन शुभ हो! 💎",
    price_inquiry: "हमारे कस्टमाइज्ड आभूषण ₹{customStartPrice} से शुरू होते हैं। आज के प्रमाणित भाव इस प्रकार हैं:\n- *22K सोना*: ₹{gold22}/ग्राम\n- *24K सोना*: ₹{gold24}/ग्राम\n- *चांदी*: ₹{silver}/ग्राम\n\nआज मैं आपकी क्या सहायता कर सकता हूँ?",
    price_inquiry_22k: "आज का प्रमाणित *22K सोने* का भाव ₹{gold22}/ग्राम है। आज मैं आपकी क्या सहायता कर सकता हूँ?",
    price_inquiry_24k: "आज का प्रमाणित *24K सोने* का भाव ₹{gold24}/ग्राम है। आज मैं आपकी क्या सहायता कर सकता हूँ?",
    price_inquiry_silver: "आज का प्रमाणित *चांदी* का भाव ₹{silver}/ग्राम है। आज मैं आपकी क्या सहायता कर सकता हूँ?",
    customization: "हम कस्टमाइज्ड ब्राइडल और लग्जरी ज्वेलरी डिज़ाइन में विशेषज्ञ हैं। मुफ़्त डिज़ाइन परामर्श के लिए अपना बजट और विचार साझा करें!",
    complaint: "असुविधा के लिए हमें खेद है। कृपया अपने ऑर्डर का विवरण साझा करें, और हमारी टीम इसे तुरंत हल करेगी।",
    purchase_intent: "बेहतरीन विकल्प! आप दो तरीकों से ऑर्डर कर सकते हैं:\n\n1. *ऑनलाइन ऑर्डर*: वेबसाइट लिंक के लिए '1' दबाएं।\n2. *चैट में ऑर्डर*: यहीं चैट पर ऑर्डर करने के लिए '2' दबाएं।\n\nआप कौन सा विकल्प पसंद करेंगे?",
    delivery_query: "पूरे भारत में डिलीवरी में 2-4 कार्यदिवस लगते हैं। कृपया अपने ऑर्डर को ट्रैक करने के लिए ऑर्डर नंबर प्रदान करें।",
    consultation_booking: "हम आपके लिए स्टोर विजिट या परामर्श शेड्यूल करना पसंद करेंगे। आपके लिए कौन सी तारीख और समय सबसे अच्छा रहेगा?",
    general_inquiry: "नमस्ते! रेनिक ज्वेलर्स में आपका स्वागत है। आज हम आपकी क्या सहायता कर सकते हैं?",
    admin_contact: "भुगतान, ऑर्डर स्थिति या सीधे प्रश्नों के लिए, कृपया हमारे प्रशासक से संपर्क करें:\n📞 {phone}\n\nवे आपकी सहायता करेंगे! 💎",
    product_selected: "बेहतरीन विकल्प! आपने *{name}* ({price}) चुना है। आप अपना ऑर्डर कैसे देना चाहेंगे?\n\n1. *वेबसाइट पर*: लिंक के लिए '1' दबाएं।\n2. *चैट में*: यहीं चैट पर बुक करने के लिए '2' दबाएं।\n\nआगे बढ़ने के लिए कृपया '1' या '2' के साथ उत्तर दें!",
    option_1_checkout: "वेबसाइट पर सीधे ऑर्डर करने के लिए लिंक:\n🔗 {productUrl}\n\nहैप्पी शॉपिंग! 💍",
    option_2_checkout: "बहुत बढ़िया! मैं यहाँ चैट में ऑर्डर करने में आपकी मदद करूँगा। 💍\n\nकृपया भेजें:\n1. आपका आकार (यदि लागू हो)\n2. आपका शिपिंग पता\n\nइन विवरणों के बाद मैं बुक करने में मदद करूँगा!",
    option_1_category: "हमारी वेबसाइट पर देखने और ऑर्डर करने का लिंक:\n🔗 {categoryUrl}\n\nहैप्पी shopping! 💍",
    option_2_category: "बहुत बढ़िया! मैं यहाँ चैट में ऑर्डर करने में आपकी मदद करूँगा। 💍\n\nकृपया भेजें:\n1. डिज़ाइन का नाम या उसकी फोटो\n2. आपका आकार\n3. आपका शिपिंग पता\n\nइन विवरणों के बाद मैं बुक करने में मदद करूँगा!",
    metal_search_header: "यहाँ हमारी वेबसाइट से कुछ चुनिंदा *{metal}* डिज़ाइनों की सूची दी गई है! 💍✨",
    metal_search_empty: "हम अपनी वेबसाइट पर *{metal}* गहनों का एक सुंदर संग्रह प्रदान करते हैं! 💍✨\n\nआप हमारे सभी नवीनतम डिज़ाइनों को यहाँ देख सकते हैं:\n🔗 {searchUrl}\n\nपरामर्श के लिए हमें बताएं!",
    catalog_prompt: "हम सीधे हमारी वेबसाइट (https://kanalli.in/) से गहनों का प्रीमियम संग्रह प्रदान करते हैं। आप आज कौन सा संग्रह देखना चाहेंगे?\n\n1. महिलाओं का संग्रह (Women's Collection) 👩\n2. पुरुषों का संग्रह (Men's Collection) 👨\n3. उपहार संग्रह (Gifts) 🎁\n\nकृपया संग्रह की संख्या या नाम के साथ उत्तर दें!",
    category_header: "यहाँ हमारी वेबसाइट से कुछ चुनिंदा *{category}* गहने दिए गए हैं! 💍✨",
    category_empty: "हम हमारी वेबसाइट पर सुंदर *{category}* संग्रह प्रदान करते हैं! 💍✨\n\nआप सभी नवीनतम डिज़ाइनों को यहाँ देख सकते हैं:\n🔗 {categoryUrl}\n\nपरामर्श के लिए हमें बताएं!",
    womens_submenu: "👩 *महिलाओं का संग्रह* 👩\nआप आज कौन सी श्रेणी देखना चाहेंगे?\n\n1. चूड़ियां (Bangle) ⭕\n2. झुमके (Earrings) 💎\n3. अंगूठियां (Rings) 💍\n4. हार (Necklace) 📿\n5. पेंडेंट (Pendant) 🎗️\n6. नाक की पिन (Nose pins) 📍\n\nकृपया श्रेणी की संख्या या नाम के साथ उत्तर दें!\n(पिछला मेनू पर जाने के लिए *back* लिखें)",
    mens_submenu: "👨 *पुरुषों का संग्रह* 👨\nआप आज कौन सी श्रेणी देखना चाहेंगे?\n\n1. कंगन (Bracelet) 📿\n2. चेन (Chains) ⛓️\n3. अंगूठियां (Rings) 💍\n\nकृपया श्रेणी की संख्या या नाम के साथ उत्तर दें!\n(पिछला मेनू पर जाने के लिए *back* लिखें)",
    product_caption: "*{idx}. {name}*\n💰 कीमत: {price}\n🔗 विवरण देखें: {productUrl}",
    product_footer: "ऊपर हमारी वेबसाइट से चुनिंदा *{subcategory}* दिखाए गए हैं।\n\nऑर्डर विकल्प पाने के लिए उत्पाद संख्या (*1*, *2*, या *3*) के साथ उत्तर दें, श्रेणियों पर वापस जाने के लिए *back* लिखें, या सभी {subcategory} देखने के लिए *know more* लिखें! 🛍️",
    rings_gender_prompt: "क्या आप अंगूठियां देखना चाहते हैं:\n1. महिलाओं के लिए (Women) 👩\n2. पुरुषों के लिए (Men) 👨\n3. उपहार संग्रह (Gifts) 🎁\n\nकृपया *1*, *2* या *3* के साथ उत्तर दें!",
    budget_match: "यहाँ ₹{maxPrice} के अंदर कुछ चुनिंदा *{category}* दिए गए हैं! 💍✨",
    budget_range_match: "यहाँ ₹{minPrice} और ₹{maxPrice} के बीच कुछ चुनिंदा *{category}* दिए गए हैं! 💍✨",
    budget_above_match: "यहाँ ₹{minPrice} से ऊपर कुछ चुनिंदा *{category}* दिए गए हैं! 💍✨",
    budget_empty: "हमें ₹{maxPrice} के अंदर कोई *{category}* नहीं मिला। हमारे डिज़ाइन्स {minAvailablePrice} से शुरू होते हैं:",
    budget_range_empty: "हमें इस सीमा में कोई *{category}* नहीं मिला। हमारे डिज़ाइन्स {minAvailablePrice} से शुरू होते हैं:",
    budget_set: "समझ गया! बजट ₹{maxPrice} के अंदर सेट कर दिया गया है।",
    budget_set_range: "समझ गया! बजट ₹{minPrice} और ₹{maxPrice} के बीच सेट कर दिया गया है।",
    budget_set_above: "समझ गया! बजट ₹{minPrice} से ऊपर सेट कर दिया गया है।",
    customization_reference: "डिजाइन की फोटो साझा करने के लिए धन्यवाद! 💍 हमारे आभूषण डिजाइनर कस्टमाइजेशन के लिए इस फोटो की समीक्षा करेंगे और जल्द ही आपसे संपर्क करेंगे।",
    know_more_prompt: "क्या आप इस श्रेणी से अधिक डिज़ाइन देखना चाहते हैं? 🔍\n\n🔗 सभी {category} डिज़ाइन यहाँ देखें:\n{categoryUrl}\n\nजवाब दें:\n- *next* या *more* इस श्रेणी से अधिक देखने के लिए\n- *back* मेनू पर जाने के लिए\n- उत्पाद संख्या (1, 2, 3) ऑर्डर करने के लिए",
    all_collections: "यहाँ हमारे सभी संग्रह हैं:\n\n👩 *महिलाओं का संग्रह*: चूड़ियां, झुमके, अंगूठियां, हार, पेंडेंट, नाक की पिन\n👨 *पुरुषों का संग्रह*: कंगन, चेन, अंगूठियां\n🎁 *उपहार संग्रह*: विशेष अवसरों के लिए\n\n🔗 सभी संग्रह देखें: {collectionsUrl}\n\nसंग्रह का नाम या संख्या दें!\n(1. महिला | 2. पुरुष | 3. उपहार)",
    more_collections_prompt: "क्या आप हमारे संग्रह से अधिक देखना चाहते हैं? 📦\n\nयहाँ सब कुछ देखें:\n🔗 {collectionsUrl}\n\nया मुझे बताएं कि आप क्या ढूंढ रहे हैं और मैं आपकी मदद करूँगा!"
  },
  ta: {
    welcome_back: "மீண்டும் வருக, {name}! ரெனிக் ஜூவல்லரியில் இன்று உங்களுக்கு எவ்வாறு உதவலாம்?",
    greeting_unknown: "வணக்கம்! ரெனிக் ஜூவல்லரிக்கு உங்களை வரவேற்கிறோம். தங்களின் பெயர் என்ன?",
    nice_to_meet_you: "உங்களை சந்தித்ததில் மகிழ்ச்சி, {name}! ரெனிக் ஜூவல்லரிக்கு உங்களை வரவேற்கிறோம். இன்று உங்களுக்கு எவ்வாறு உதவலாம்?",
    thank_you: "மிக்க மகிழ்ச்சி{namePart}! உங்களுக்கு மேலும் ஏதேனும் உதவி தேவைப்பட்டால் கேட்கலாம். இனிய நாள் அமையட்டும்! 💎",
    price_inquiry: "எங்கள் தனிப்பயனாக்கப்பட்ட நகைகள் ₹{customStartPrice} முதல் தொடங்குகின்றன. இன்றைய சான்றளிக்கப்பட்ட தங்கம் மற்றும் வெள்ளி விலைகள்:\n- *22K தங்கம்*: ₹{gold22}/கிராம்\n- *24K தங்கம்*: ₹{gold24}/கிராம்\n- *வெள்ளி*: ₹{silver}/கிராம்\n\nஇன்று உங்களுக்கு என்ன நகைகள் தேவை?",
    price_inquiry_22k: "இன்றைய சான்றளிக்கப்பட்ட *22K தங்கம்* விலை: ₹{gold22}/கிராம். இன்று உங்களுக்கு என்ன நகைகள் தேவை?",
    price_inquiry_24k: "இன்றைய சான்றளிக்கப்பட்ட *24K தங்கம்* விலை: ₹{gold24}/கிராம். இன்று உங்களுக்கு என்ன நகைகள் தேவை?",
    price_inquiry_silver: "இன்றைய சான்றளிக்கப்பட்ட *வெள்ளி* விலை: ₹{silver}/கிராம். இன்று உங்களுக்கு என்ன நகைகள் தேவை?",
    customization: "நாங்கள் திருமண மற்றும் ஆடம்பர நகை வடிவமைப்புகளை செய்து தருகிறோம். இலவச ஆலோசனைக்கு உங்கள் பட்ஜெட் மற்றும் வடிவமைப்பு யோசனைகளை எங்களுடன் பகிர்ந்து கொள்ளுங்கள்!",
    complaint: "ஏற்பட்ட அசௌகரியத்திற்கு வருந்துகிறோம். உங்கள் ஆர்டர் விவரங்களை எங்களுடன் பகிர்ந்து கொள்ளுங்கள், எங்கள் குழு உடனடியாக தீர்வு காணும்.",
    purchase_intent: "சிறந்த தேர்வு! நீங்கள் இரு வழிகளில் ஆர்டர் செய்யலாம்:\n\n1. *இணையதளம் வழியாக*: இணையதள இணைப்பை பெற '1' என பதிலளிக்கவும்.\n2. *வாட்ஸ்அப் அரட்டை*: இங்கேயே ஆர்டர் செய்ய '2' என பதிலளிக்கவும்.\n\nதங்களுக்கு எது வசதி?",
    delivery_query: "இந்தியா முழுவதும் டெலிவரி செய்ய 2-4 நாட்கள் ஆகும். உங்கள் ஆர்டரை கண்காணிக்க ஆர்டர் எண்ணை பகிரவும்.",
    consultation_booking: "தங்களுக்கு ஆலோசனை வழங்க அல்லது எங்கள் கடைக்கு வர முன்பதிவு செய்ய விரும்புகிறோம். தங்களுக்கு எந்த தேதி மற்றும் நேரம் வசதியாக இருக்கும்?",
    general_inquiry: "வணக்கம்! ரெனிக் ஜூவல்லரிக்கு உங்களை வரவேற்கிறோம். இன்று உங்களுக்கு எவ்வாறு உதவலாம்?",
    admin_contact: "பணம் செலுத்துதல், ஆர்டர் நிலை அல்லது நேரடி விசாரணைகளுக்கு, எங்கள் நிர்வாகியைத் தொடர்பு கொள்ளவும்:\n📞 {phone}\n\nஅவர்கள் உங்களுக்கு உதவுவார்கள்! 💎",
    product_selected: "சிறந்த தேர்வு! நீங்கள் *{name}* ({price}) தேர்ந்தெடுத்துள்ளீர்கள். நீங்கள் எவ்வாறு ஆர்டர் செய்ய விரும்புகிறீர்கள்?\n\n1. *இணையதளம்*: இணையதளத்தில் ஆர்டர் செய்ய '1' என பதிலளிக்கவும்.\n2. *அரட்டை*: இங்கேயே ஆர்டர் செய்ய '2' என பதிலளிக்கவும்.\n\nதொடர தயவுசெய்து '1' அல்லது '2' உடன் பதிலளிக்கவும்!",
    option_1_checkout: "இணையதளத்தில் நேரடியாக ஆர்டர் செய்ய இதோ இணைப்பு:\n🔗 {productUrl}\n\nமகிழ்ச்சியான ஷாッピング! 💍",
    option_2_checkout: "மிகவும் நல்லது! இங்கேயே அரட்டையில் ஆர்டர் செய்ய உங்களுக்கு உதவுகிறேன். 💍\n\nதயவுசெய்து பகிரவும்:\n1. தங்களின் அளவு (Size - பொருந்தினால்)\n2. தங்களின் முகவரி (Shipping Address)\n\nஆர்டரை முன்பதிவு செய்ய நான் உதவுகிறேன்!",
    option_1_category: "இணையதளத்தில் நகைகளை பார்க்க மற்றும் ஆர்டர் செய்ய இணைப்பு:\n🔗 {categoryUrl}\n\nமகிழ்ச்சியான ஷாッピング! 💍",
    option_2_category: "மிகவும் நல்லது! இங்கேயே அரட்டையில் ஆர்டர் செய்ய உங்களுக்கு உதவுகிறேன். 💍\n\nதயவுசெய்து பகிரவும்:\n1. வடிவமைப்பின் பெயர் அல்லது படம்\n2. தங்களின் அளவு (Size)\n3. தங்களின் முகவரி (Address)\n\nஆர்டரை முன்பதிவு செய்ய நான் உதவுகிறேன்!",
    metal_search_header: "எங்கள் இணையதளத்தில் உள்ள சில பிரத்தியேக *{metal}* நகை வடிவமைப்புகள் இதோ! 💍✨",
    metal_search_empty: "எங்கள் இணையதளத்தில் அழகான *{metal}* நகைகள் உள்ளன! 💍✨\n\nஎங்களின் அனைத்து வடிவமைப்புகளையும் விலைகளையும் இங்கே பார்க்கலாம்:\n🔗 {searchUrl}\n\nஆலோசனைக்கு எங்களை தொடர்பு கொள்ளவும்!",
    catalog_prompt: "எங்கள் இணையதளத்தில் (https://kanalli.in/) உள்ள பிரீமியம் நகை வடிவமைப்புகளை வழங்குகிறோம். இன்று எந்த பிரிவை ஆராய விரும்புகிறீர்கள்?\n\n1. பெண்கள் பிரிவு (Women's Collection) 👩\n2. ஆண்கள் பிரிவு (Men's Collection) 👨\n3. பரிசு பொருட்கள் (Gifts) 🎁\n\nதயவுசெய்து வகையின் பெயர் அல்லது எண்ணை பதிலளிக்கவும்!",
    category_header: "எங்கள் இணையதளத்தில் உள்ள சில பிரத்தியேக *{category}* நகைகள் இதో! 💍✨",
    category_empty: "எங்கள் இணையதளத்தில் அழகான *{category}* நகைகள் உள்ளன! 💍✨\n\nஎங்களின் அனைத்து வடிவமைப்புகளையும் இங்கே பார்க்கலாம்:\n🔗 {categoryUrl}\n\nஆலோசனைக்கு எங்களை தொடர்பு கொள்ளவும்!",
    womens_submenu: "👩 *பெண்கள் பிரிவு* 👩\nஇன்று நீங்கள் எந்த வகையைத் தேடுகிறீர்கள்?\n\n1. வளையல்கள் (Bangle) ⭕\n2. கம்மல்கள் (Earrings) 💎\n3. மோதிரங்கள் (Rings) 💍\n4. நெக்லஸ்கள் (Necklace) 📿\n5. பதக்கங்கள் (Pendant) 🎗️\n6. மூக்குத்திகள் (Nose pins) 📍\n\nதயவுசெய்து எண் அல்லது வகையின் பெயருடன் பதிலளிக்கவும்!\n(முந்தைய மெனுவிற்கு செல்ல *back* என டைப் செய்யவும்)",
    mens_submenu: "👨 *ஆண்கள் பிரிவு* 👨\nஇன்று நீங்கள் எந்த வகையைத் தேடுகிறீர்கள்?\n\n1. காப்புகள் (Bracelet) 📿\n2. செயின்கள் (Chains) ⛓️\n3. மோதிரங்கள் (Rings) 💍\n\nதயவுசெய்து எண் அல்லது வகையின் பெயருடன் பதிலளிக்கவும்!\n(முந்தைய மெனுவிற்கு செல்ல *back* என டைப் செய்யவும்)",
    product_caption: "*{idx}. {name}*\n💰 விலை: {price}\n🔗 விவரம் பார்க்க: {productUrl}",
    product_footer: "மேலே எங்கள் இணையதளத்தில் உள்ள சில பிரத்தியேக *{subcategory}* நகைகள் உள்ளன.\n\nஆர்டர் விருப்பங்களைப் பெற தயாரிப்பு எண்ணுடன் (*1*, *2*, அல்லது *3*) பதிலளிக்கவும், அல்லது முந்தைய மெனுவிற்கு செல்ல *back* என டைப் செய்யவும்! 🛍️",
    rings_gender_prompt: "மால்களை யாருக்கு பார்க்க விரும்புகிறீர்கள்:\n1. பெண்களுக்கு (Women) 👩\n2. ஆண்களுக்கு (Men) 👨\n3. பரிசு பொருட்கள் (Gifts) 🎁\n\nதயவுசெய்து *1*, *2* அல்லது *3* உடன் பதிலளிக்கவும்!",
    budget_match: "தங்களின் ₹{maxPrice} பட்ஜெட்டுக்கு ஏற்ற சில பிரத்தியேக *{category}* இதோ! 💍✨",
    budget_range_match: "₹{minPrice} முதல் ₹{maxPrice} வரை உள்ள சில பிரத்தியேக *{category}* இதோ! 💍✨",
    budget_above_match: "₹{minPrice} முதல் தொடங்கும் சில பிரத்தியேக *{category}* இதோ! 💍✨",
    budget_empty: "₹{maxPrice} பட்ஜெட்டில் *{category}* எதுவும் இல்லை. எங்களின் நகைகள் {minAvailablePrice} முதல் தொடங்குகின்றன:",
    budget_range_empty: "இந்த வரம்பில் *{category}* எதுவும் இல்லை. எங்களின் நகைகள் {minAvailablePrice} முதல் தொடங்குகின்றன:",
    budget_set: "சரி! தங்களின் பட்ஜெட் ₹{maxPrice}-க்குள் அமைக்கப்பட்டுள்ளது.",
    budget_set_range: "சரி! தங்களின் பட்ஜெட் ₹{minPrice} முதல் ₹{maxPrice} வரை அமைக்கப்பட்டுள்ளது.",
    budget_set_above: "சரி! தங்களின் பட்ஜெட் ₹{minPrice}-க்கு மேல் அமைக்கப்பட்டுள்ளது.",
    customization_reference: "வடிவமைப்பு படத்தை பகிர்ந்து கொண்டதற்கு நன்றி! 💍 உங்கள் நகையை தனிப்பயனாக்க எங்கள் நகை வடிவமைப்பாளர் இதை மதிப்பாய்வு செய்து விரைவில் உங்களைத் தொடர்புகொள்வார்.",
    know_more_prompt: "இந்த பகுப்பிலிருந்து மேலும் வடிவமைப்புகளை பார்க்க விரும்புகிறீர்களா? 🔍\n\n🔗 சகல {category} வடிவமைப்புகளை இங்கே பாருங்கள்:\n{categoryUrl}\n\nபதிலளிக்கவும்:\n- *next* அல்லது *more* இந்த பகுப்பிலிருந்து மேலும் பார்க்க\n- *back* பட்டியலுக்கு வர\n- தயாரிப்பு எண் (1, 2, 3) ஆர்டர் செய்ய",
    all_collections: "இங்கே எங்கள் சகல சேகரணங்கள் உள்ளன:\n\n👩 *பெண்கள் சேகரணம்*: வளையல்கள், கம்மல்கள், மோதிரங்கள், நெக்லஸ்கள், பதக்கங்கள், மூக்குத்திகள்\n👨 *ஆண்கள் சேகரணம்*: காப்புகள், செயின்கள், மோதிரங்கள்\n🎁 *பரிசு சேகரணம்*: சிறப்பு நிகழ்வுக்கான பொருட்கள்\n\n🔗 சகல சேகரணங்களை பாருங்கள்: {collectionsUrl}\n\nசேகரணத்தின் பெயர் அல்லது எண்ணை பதிலளிக்கவும்!\n(1. பெண்கள் | 2. ஆண்கள் | 3. பரிசு)",
    more_collections_prompt: "எங்கள் சேகரணத்திலிருந்து மேலும் பார்க்க விரும்புகிறீர்களா? 📦\n\nஇங்கே சகல பொருட்களை பாருங்கள்:\n🔗 {collectionsUrl}\n\nஅல்லது நீங்கள் என்ன தேடுகிறீர்கள் என்பதை சொல்லி விட்டால் நான் உங்களுக்கு உதவுவேன்!"
  },
  te: {
    welcome_back: "తిరిగి వచ్చినందుకు స్వాగతం, {name}! రేనిక్ జ్యువెలర్స్ లో ఈరోజు మీకు ఎలా సహాయపడగలము?",
    greeting_unknown: "నమస్కారం! రేనిక్ జ్యువెలర్స్ కు స్వాగతం. దయచేసి మీ పేరు తెలుసుకోవచ్చా?",
    nice_to_meet_you: "మిమ్మల్ని కలవడం సంతోషంగా ఉంది, {name}! రేనిక్ జ్యువెలర్స్ కు స్వాగతం. ఈరోజు మీకు ఎలా సహాయపడగలము?",
    thank_you: "మీకు ధన్యవాదాలు{namePart}! ఇంకా ఏదైనా సహాయం కావాలన్నా లేదా మా కలెక్షన్స్ చూడాలన్నా అడగండి. మీ రోజు శుభప్రదంగా ఉండాలి! 💎",
    price_inquiry: "మా కస్టమైజ్డ్ నగలు ₹{customStartPrice} నుండి ప్రారంభమవుతాయి. ఈరోజు ధరలు:\n- *22K బంగారం*: ₹{gold22}/గ్రాము\n- *24K బంగారం*: ₹{gold24}/గ్రాము\n- *వెండి*: ₹{silver}/గ్రాము\n\nఈరోజు మీకు ఏ నగలు కావాలి?",
    price_inquiry_22k: "ఈరోజు *22K బంగారం* ధర: ₹{gold22}/గ్రాము. ఈరోజు మీకు ఏ నగలు కావాలి?",
    price_inquiry_24k: "ఈరోజు *24K బంగారం* ధర: ₹{gold24}/గ్రాము. ఈరోజు మీకు ఏ నగలు కావాలి?",
    price_inquiry_silver: "ఈరోజు *వెండి* ధర: ₹{silver}/గ్రాము. ఈరోజు మీకు ఏ నగలు కావాలి?",
    customization: "మేము బ్రైడల్ మరియు లగ్జరీ నగల డిజైన్లను తయారు చేస్తాము. ఉచిత కన్సల్టేషన్ కోసం మీ బడ్జెట్ మరియు ఐడియాలను పంచుకోండి!",
    complaint: "ఆద తర్నెలకి క్షమించండి. దయచేసి మీ ఆర్డర్ వివరాలను పంచుకోండి, మా టీమ్ వెంటనే పరిష్కరిస్తుంది.",
    purchase_intent: "మంచి ఎంపిక! మీరు రెండు విధాలుగా ఆర్డర్ చేయవచ్చు:\n\n1. *వెబ్‌సైట్ ద్వారా*: వెబ్‌సైట్ లింక్ కోసం '1' అని రిప్లై ఇవ్వండి.\n2. *చాట్ ద్వారా*: ఇక్కడే ఆర్డర్ చేయడానికి '2' అని రిప్లై ఇవ్వండి.\n\nమీకు ఏ ఆప్షన్ కావాలి?",
    delivery_query: "భారతదేశం అంతటా డెలివరీకి 2-4 రోజులు పడుతుంది. మీ ఆర్డర్ ట్రాక్ చేయడానికి ఆర్డర్ నంబర్ ఇవ్వండి.",
    consultation_booking: "మేము మీ కోసం స్టోర్ విజిట్ లేదా కన్సల్టేషన్ షెడ్యూల్ చేయాలనుకుంటున్నాము. మీకు ఏ తేదీ మరియు సమయం అనుకూలంగా ఉంటుంది?",
    general_inquiry: "నమస్కారం! రేనిక్ జ్యువెలర్స్ కు స్వాగతం. ఈరోజు మీకు ఎలా సహాయపడగలము?",
    admin_contact: "చెల్లింపులు, ఆర్డర్ స్టేటస్ లేదా ఇతర ప్రశ్నల కోసం, మా అడ్మినిస్ట్రేటర్ ని సంప్రదించండి:\n📞 {phone}\n\nవారు మీకు సహాయం చేస్తారు! 💎",
    product_selected: "మంచి ఎంపిక! మీరు *{name}* ({price}) ఎంచుకున్నారు. మీరు ఎలా ఆర్డర్ చేయాలనుకుంటున్నారు?\n\n1. *వెబ్‌సైట్*: లింక్ కోసం '1' అని రిప్లై ఇవ్వండి.\n2. *చాట్*: ఇక్కడే బుక్ చేయడానికి '2' అని రిప్లై ఇవ్వండి.\n\nముందుకు సాగడానికి దయచేసి '1' లేదా '2' తో రిప్లై ఇవ్వండి!",
    option_1_checkout: "వెబ్‌సైట్ లో నేరుగా ఆర్డర్ చేయడానికి లింక్:\n🔗 {productUrl}\n\nహ్యాపీ షాపింగ్! 💍",
    option_2_checkout: "చాలా మంచిది! ఇక్కడే ఆర్డర్ చేయడానికి నేను సహాయం చేస్తాను. 💍\n\nదయచేసి పంపండి:\n1. మీ సైజ్ (Size)\n2. మీ అడ్రస్ (Address)\n\nఈ వివరాల తర్వాత నేను బుక్ చేయడానికి సహాయం చేస్తాను!",
    option_1_category: "వెబ్‌సైట్ లో నగల చూడటానికి మరియు ఆర్డర్ చేయడానికి లింక్:\n🔗 {categoryUrl}\n\nహ్యాపీ షాపింగ్! 💍",
    option_2_category: "చాలా మంచిది! ఇక్కడే ఆర్డర్ చేయడానికి నేను సహాయం చేస్తాను. 💍\n\nదయచేసి పంపండి:\n1. డిజైన్ పేరు లేదా ఫోటో\n2. మీ సైజ్ (Size)\n3. మీ అడ్రస్ (Address)\n\nఈ వివరాల తర్వాత నేను బుక్ చేయడానికి సహాయం చేస్తాను!",
    metal_search_header: "మా వెబ్‌సైట్ నుండి కొన్ని ప్రత్యేకమైన *{metal}* డిజైన్లు ఇవిగో! 💍✨",
    metal_search_empty: "మా వెబ్‌సైట్ లో అందమైన *{metal}* నగలు ఉన్నాయి! 💍✨\n\nమా డిజైన్లన్నింటినీ ఇక్కడ చూడవచ్చు:\n🔗 {searchUrl}\n\nసలహాల కోసం మమ్మల్ని సంప్రదించండి!",
    catalog_prompt: "మేము మా వెబ్‌సైట్ (https://kanalli.in/) నుండి నేరుగా ప్రీమియం నగలు అందిస్తున్నాము. మీరు ఈరోజు ఏ కలెక్షన్ చూడాలనుకుంటున్నారు?\n\n1. మహిళల కలెక్షన్ (Women's Collection) 👩\n2. పురుషుల కలెక్షన్ (Men's Collection) 👨\n3. గిఫ్ట్స్ (Gifts) 🎁\n\nదయచేసి కేటగిరీ సంఖ్య లేదా పేరుతో రిప్లై ఇవ్వండి!",
    category_header: "మా వెబ్‌సైట్ నుండి కొన్ని ప్రత్యేకమైన *{category}* డిజైన్లు ఇవిగో! 💍✨",
    category_empty: "మా వెబ్‌సైట్ లో అందమైన *{category}* కలెక్షన్స్ ఉన్నాయి! 💍✨\n\nడిజైన్లన్నింటినీ ఇక్కడ చూడవచ్చు:\n🔗 {categoryUrl}\n\nసలహాల కోసం మమ్మల్ని సంప్రదించండి!",
    womens_submenu: "👩 *మహిళల కలెక్షన్* 👩\nఈరోజు మీరు ఏ కేటగిరీ చూడాలనుకుంటున్నారు?\n\n1. గాజులు (Bangle) ⭕\n2. చెవి రింగులు (Earrings) 💎\n3. ఉంగరాలు (Rings) 💍\n4. నెక్లెస్లు (Necklace) 📿\n5. లాకెట్లు (Pendant) 🎗️\n6. ముక్కు పుడకలు (Nose pins) 📍\n\nదయచేసి సంఖ్య లేదా పేరుతో రిప్లై ఇవ్వండి!\n(మునుపటి మెనూకి వెళ్లడానికి *back* అని టైప్ చేయండి)",
    mens_submenu: "👨 *పురుషుల కలెక్షన్* 👨\nఈరోజు మీరు ఏ కేటగిరీ చూడాలనుకుంటున్నారు?\n\n1. బ్రాస్లెట్లు (Bracelet) 📿\n2. చైన్స్ (Chains) ⛓️\n3. ఉంగరాలు (Rings) 💍\n\nదయచేసి సంఖ్య లేదా పేరుతో రిప్లై ఇవ్వండి!\n(మునుపటి మెనూకి వెళ్లడానికి *back* అని టైప్ చేయండి)",
    product_caption: "*{idx}. {name}*\n💰 ధర: {price}\n🔗 వివరాలు చూడండి: {productUrl}",
    product_footer: "పైన మా వెబ్‌సైట్ నుండి కొన్ని ప్రత్యేకమైన *{subcategory}* డిజైన్లు ఉన్నాయి.\n\nఆర్డర్ ఆప్షన్ల కోసం ప్రొడక్ట్ సంఖ్యతో (*1*, *2*, లేదా *3*) రిప్లై ఇవ్వండి, లేదా వెనుకకు వెళ్ళడానికి *back* అని టైప్ చేయండి! 🛍️",
    rings_gender_prompt: "మీరు ఉంగరాలు ఎవరి కోసం చూడాలనుకుంటున్నారు:\n1. మహిళల కోసం (Women) 👩\n2. పురుషుల కోసం (Men) 👨\n3. గిఫ్ట్స్ (Gifts) 🎁\n\nదయచేసి *1*, *2* లేదా *3* తో రిప్లై ఇవ్వండి!",
    customization_reference: "డిజైన్ చిత్రాన్ని పంచుకున్నందుకు ధన్యవాదాలు! 💍 మా జ్యువెలరీ డిజైనర్ దీని ఆధారంగా మీ నగను కస్టమైజ్ చేయడానికి పరిశీలించి త్వరలోనే మిమ్మల్ని సంప్రదిస్తారు."
  },
  mr: {
    welcome_back: "पुन्हा स्वागत आहे, {name}! आज आम्ही रेनिक ज्वेलर्समध्ये आपली काय मदत करू शकतो?",
    greeting_unknown: "नमस्कार! रेनिक ज्वेलर्समध्ये आपले स्वागत आहे. कृपया आपले नाव काय आहे?",
    nice_to_meet_you: "तुम्हाला भेटून आनंद झाला, {name}! रेनिक ज्वेलर्समध्ये आपले स्वागत आहे. आज आम्ही आपली काय मदत करू शकतो?",
    thank_you: "तुमचे स्वागत आहे{namePart}! आपल्याला आणखी काही मदत हवी असल्यास नक्की विचारा. आपला दिवस चांगला जावो! 💎",
    price_inquiry: "आमचे कस्टमाइज्ड दागिने ₹{customStartPrice} पासून सुरू होतात. आजचे प्रमाणित दर खालीलप्रमाणे आहेत:\n- *22K सोने*: ₹{gold22}/ग्रॅम\n- *24K सोने*: ₹{gold24}/ग्रॅम\n- *चांदी*: ₹{silver}/ग्रॅम\n\nआज आम्ही आपली काय मदत करू शकतो?",
    price_inquiry_22k: "आजचा प्रमाणित *22K सोन्याचा* दर ₹{gold22}/ग्रॅम आहे. आज आम्ही आपली काय मदत करू शकतो?",
    price_inquiry_24k: "आजचा प्रमाणित *24K सोन्याचा* दर ₹{gold24}/ग्रॅम आहे. आज आम्ही आपली काय मदत करू शकतो?",
    price_inquiry_silver: "आजचा प्रमाणित *चांदीचा* दर ₹{silver}/ग्रॅम आहे. आज आम्ही आपली काय मदत करू शकतो?",
    customization: "आम्ही लग्नाचे आणि विशेष डिझाईन्सचे दागिने बनवून देतो. मोफत सल्ल्यासाठी तुमचे बजेट आणि कल्पना आमच्याशी शेअर करा!",
    complaint: "आपल्याला झालेल्या त्रासाबद्दल आम्ही दिलगीर आहोत. कृपया ऑर्डरचे तपशील शेअर करा, आमची टीम त्वरित सोडवणूक करेल.",
    purchase_intent: "उत्कृष्ट निवड! आपण दोन प्रकारे ऑर्डर करू शकता:\n\n1. *वेबसाइटवर*: वेबसाइट लिंकसाठी '1' उत्तर द्या.\n2. *चॅटवर*: येथेच ऑर्डर करण्यासाठी '2' उत्तर द्या.\n\nआपल्याला कोणता पर्याय आवडेल?",
    delivery_query: "संपूर्ण भारतात डिलिव्हरीसाठी २-४ दिवस लागतात. कृपया ट्रॅक करण्यासाठी ऑर्डर नंबर शेअर करा.",
    consultation_booking: "आम्हाला आपल्यासाठी कन्सल्टेशन किंवा स्टोअर भेट शेड्यूल करायला आवडेल. आपल्यासाठी कोणती तारीख आणि वेळ योग्य असेल?",
    general_inquiry: "नमस्कार! रेनिक ज्वेलर्समध्ये आपले स्वागत आहे. आज आम्ही आपली काय मदत करू शकतो?",
    admin_contact: "पेमेंट, ऑर्डर स्टेटस किंवा थेट चौकशीसाठी, आमच्या ॲडमिनशी संपर्क साधा:\n📞 {phone}\n\nते आपली मदत करतील! 💎",
    product_selected: "उत्कृष्ट निवड! आपण *{name}* ({price}) निवडले है. आपण ऑर्डर कशी करू इच्छिता?\n\n1. *वेबसाइट*: लिंकसाठी '1' उत्तर द्या.\n2. *चॅट*: येथेच बुक करण्यासाठी '2' उत्तर द्या.\n\nपुढे जाण्यासाठी कृपया '1' किंवा '2' ने उत्तर द्या!",
    option_1_checkout: "वेबसाइटवर थेट ऑर्डर करण्यासाठी लिंक:\n🔗 {productUrl}\n\nआनंदी खरेदी! 💍",
    option_2_checkout: "खूप छान! मी येथे चॅटमध्ये ऑर्डर करण्यास मदत करेन. 💍\n\nकृपया पाठवा:\n1. आपला आकार (लागू असल्यास)\n2. आपला पत्ता\n\nया तपशीलांनंतर मी बुक करण्यास मदत करेन!",
    option_1_category: "वेबसाइटवर दागिने पाहण्यासाठी आणि ऑर्डर करण्यासाठी लिंक:\n🔗 {categoryUrl}\n\nआनंदी खरेदी! 💍",
    option_2_category: "खूप छान! मी येथे चॅटमध्ये ऑर्डर करण्यास मदत करेन. 💍\n\nकृपया पाठवा:\n1. डिझाईनचे नाव किंवा फोटो\n2. आपला आकार\n3. आपला पत्ता\n\nया तपशीलांनंतर मी बुक करण्यास मदत करेन!",
    metal_search_header: "आमच्या वेबसाइटवरील काही खास *{metal}* डिझाईन्स खालीलप्रमाणे आहेत! 💍✨",
    metal_search_empty: "आमच्या वेबसाइटवर सुंदर *{metal}* दागिन्यांचे कलेक्शन उपलब्ध आहे! 💍✨\n\nसर्व डिझाईन्स येथे पहा:\n🔗 {searchUrl}\n\nसल्ल्यासाठी संपर्क साधा!",
    catalog_prompt: "आम्ही आमच्या वेबसाइटवरून (https://kanalli.in/) थेट प्रीमियम दागिने प्रदान करतो. आपण आज कोणते कलेक्शन पाहू इच्छिता?\n\n1. महिलांचे कलेक्शन (Women's Collection) 👩\n2. पुरुषांचे कलेक्शन (Men's Collection) 👨\n3. भेटवस्तू संग्रह (Gifts) 🎁\n\nकृपया श्रेणीची संख्या किंवा नावाने उत्तर द्या!",
    category_header: "आमच्या वेबसाइटवरील काही खास *{category}* डिझाईन्स खालीलप्रमाणे आहेत! 💍✨",
    category_empty: "आमच्या वेबसाइटवर सुंदर *{category}* दागिन्यांचे कलेक्शन उपलब्ध आहे! 💍✨\n\nसर्व डिझाईन्स येथे पहा:\n🔗 {categoryUrl}\n\nसल्ल्यासाठी संपर्क साधा!",
    womens_submenu: "👩 *महिलांचे कलेक्शन* 👩\nआज आपण कोणती श्रेणी शोधत आहात?\n\n1. बांगड्या (Bangle) ⭕\n2. झुमके (Earrings) 💎\n3. अंगठ्या (Rings) 💍\n4. हार (Necklace) 📿\n5. पेंडेंट (Pendant) 🎗️\n6. नथ (Nose pins) 📍\n\nकृपया पर्याय संख्या किंवा नावाने उत्तर द्या!\n(मागील मेनूवर जाण्यासाठी *back* लिहा)",
    mens_submenu: "👨 *पुरुषांचे कलेक्शन* 👨\nआज आपण कोणती श्रेणी शोधत आहात?\n\n1. कडे (Bracelet) 📿\n2. चेन (Chains) ⛓️\n3. अंगठ्या (Rings) 💍\n\nकृपया पर्याय संख्या किंवा नावाने उत्तर द्या!\n(मागील मेनूवर जाण्यासाठी *back* लिहा)",
    product_caption: "*{idx}. {name}*\n💰 किंमत: {price}\n🔗 तपशील पहा: {productUrl}",
    product_footer: "वर आमच्या वेबसाइटवरील काही खास *{subcategory}* दाखवले आहेत.\n\nऑर्डर पर्याय मिळवण्यासाठी उत्पादन क्रमांकासह (*1*, *2*, किंवा *3*) उत्तर द्या, या श्रेणींवर परत जाण्यासाठी *back* लिहा! 🛍️",
    rings_gender_prompt: "तुम्ही अंगठ्या कोणासाठी पाहू इच्छिता:\n1. महिलांसाठी (Women) 👩\n2. पुरुषांसाठी (Men) 👨\n3. भेटवस्तू (Gifts) 🎁\n\nकृपया *1*, *2* किंवा *3* ने उत्तर द्या!",
    customization_reference: "डिझाइनचा फोटो शेअर केल्याबद्दल धन्यवाद! 💍 आमचे ज्वेलरी डिझायनर कस्टमायझेशनसाठी याचे पुनरावलोकन करतील आणि लवकरच तुमच्याशी संपर्क साधतील।",
    know_more_prompt: "या श्रेणीमधील अधिक डिझाईन्स पाहू इच्छिता? 🔍\n\n🔗 सर्व {category} डिझाईन्स येथे पाहा:\n{categoryUrl}\n\nउत्तर द्या:\n- *next* किंवा *more* या श्रेणीमधून अधिक पाहण्यासाठी\n- *back* मेनूवर जाण्यासाठी\n- उत्पादन क्रमांक (1, 2, 3) ऑर्डर करण्यासाठी",
    all_collections: "येथे आमचे सर्व संग्रह आहेत:\n\n👩 *महिलांचे संग्रह*: बांगड्या, झुमके, अंगठ्या, हार, पेंडेंट, नथ\n👨 *पुरुषांचे संग्रह*: कडे, चेन, अंगठ्या\n🎁 *भेटवस्तु संग्रह*: विशेष प्रसंगासाठी\n\n🔗 सर्व संग्रह पाहा: {collectionsUrl}\n\nसंग्रहाचे नाव किंवा क्रमांक द्या!\n(1. महिला | 2. पुरुष | 3. भेटवस्तु)",
    more_collections_prompt: "आमच्या संग्रहमधून अधिक पाहू इच्छिता? 📦\n\nयेथे सर्व काही पाहा:\n🔗 {collectionsUrl}\n\nकिंवा मुझे सांगा तुम्ही काय शोधत आहात आणि मी तुम्हाला मदत करेन!"
  },
  kn: {
    welcome_back: "ಮರಳಿ ಸ್ವಾಗತ, {name}! ಇಂದು ರೆನಿಕ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್ ನಲ್ಲಿ ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    greeting_unknown: "ನಮಸ್ಕಾರ! ರೆನಿಕ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್ ಗೆ ಸ್ವಾಗತ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ತಿಳಿಸಬಹುದೇ?",
    nice_to_meet_you: "ನಿಮ್ಮನ್ನು ಭೇಟಿ ಮಾಡಿದ್ದಕ್ಕೆ ಸಂತೋಷ, {name}! ರೆನಿಕ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್ ಗೆ ಸ್ವಾಗತ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    thank_you: "ನಿಮಗೆ ಸ್ವಾಗತ{namePart}! ಇನ್ಯಾವುದೇ ಸಹಾಯ ಬೇಕಿದ್ದಲ್ಲಿ ಅಥವಾ ನಮ್ಮ ಕಲೆಕ್ಷನ್ ನೋಡಬೇಕಿದ್ದಲ್ಲಿ ಕೇಳಿ. ನಿಮ್ಮ ದಿನ ಶುಭವಾಗಿರಲಿ! 💎",
    price_inquiry: "ನಮ್ಮ ಕಸ್ಟಮೈಸ್ ಮಾಡಿದ ಆಭರಣಗಳು ₹{customStartPrice} ರಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತವೆ. ಇಂದಿನ ಚಿನ್ನ ಮತ್ತು ಬೆಳ್ಳಿ ದರಗಳು:\n- *22K ಚಿನ್ನ*: ₹{gold22}/ಗ್ರಾಂ\n- *24K ಚಿನ್ನ*: ₹{gold24}/ಗ್ರಾಂ\n- *ಬೆಳ್ಳಿ*: ₹{silver}/ಗ್ರಾಂ\n\nಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    price_inquiry_22k: "ಇಂದಿನ ಪ್ರಮಾಣೀಕೃತ *22K ಚಿನ್ನದ* ದರ: ₹{gold22}/ಗ್ರಾಂ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    price_inquiry_24k: "ಇಂದಿನ ಪ್ರಮಾಣೀಕೃತ *24K ಚಿನ್ನದ* ದರ: ₹{gold24}/ಗ್ರಾಂ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    price_inquiry_silver: "ಇಂದಿನ ಪ್ರಮಾಣೀಕೃತ *ಬೆಳ್ಳಿಯ* ದರ: ₹{silver}/ಗ್ರಾಂ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    customization: "ನಾವು ಕಸ್ಟಮ್ ಬ್ರೈಡಲ್ ಮತ್ತು ಐಷಾರಾಮಿ ಆಭರಣ ವಿನ್ಯಾಸಗಳಲ್ಲಿ ಪರಿಣతి ಹೊಂದಿದ್ದೇವೆ. ಉಚಿತ ವಿನ್ಯಾಸ ಸಮಾಲೋಚನೆಗಾಗಿ ನಿಮ್ಮ ಸಂದರ್ಭ, ಬಜೆಟ್ ಮತ್ತು ಐಡಿಯಾಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ!",
    complaint: "ಆದ ತೊಂದರೆಗೆ ಪ್ರಾಮಾಣಿಕವಾಗಿ ಕ್ಷಮೆಯಾಚಿಸುತ್ತೇವೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಆರ್ಡರ್ ವಿವರಗಳು ಮತ್ತು ಸಮಸ್ಯೆಯನ್ನು ಹಂಚಿಕೊಳ್ಳಿ, ನಮ್ಮ ತಂಡ ತಕ್ಷಣವೇ ಅದನ್ನು ಪರಿಹರಿಸುತ್ತದೆ.",
    purchase_intent: "ಅತ್ಯುತ್ತಮ ಆಯ್ಕೆ! ನೀವು ಎರಡು ರೀತಿಯಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಬಹುದು:\n\n1. *ವೆಬ್‌ಸೈಟ್‌ ನಲ್ಲಿ*: ನೇರವಾಗಿ ಚೆಕ್‌ಔಟ್ ಮಾಡಲು '1' ಎಂದು ಉತ್ತರಿಸಿ.\n2. *ಚಾಟ್‌ನಲ್ಲಿ*: ನೇರವಾಗಿ ಆರ್ಡರ್ ಮಾಡಲು '2' ಎಂದು ಉತ್ತರಿಸಿ.\n\nನಿಮಗೆ ಯಾವ ಆಯ್ಕೆ ಸೂಕ್ತ?",
    delivery_query: "ಭಾರತದಾದ್ಯಂತ ಪ್ರಮಾಣಿತ ವಿತರಣೆಗೆ 2-4 ವ್ಯವಹಾರ ದಿನಗಳು ಬೇಕಾಗುತ್ತವೆ. ನಿಮ್ಮ ಸಾಗಣೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ದಯವಿಟ್ಟು ಆರ್ಡರ್ ಸಂಖ್ಯೆಯನ್ನು ನೀಡಿ.",
    consultation_booking: "ನಿಮಗಾಗಿ ಸಮಾಲೋಚನೆ ಅಥವಾ ಅಂಗಡಿ ಭೇಟಿಯನ್ನು నిగదిపదిసలు నిగదిపదిసಲು నిగదిపదిసలు నిగదిపదిసಲು నిగదిపదిసలు నిగదిపదిసలు నిగదిపదిసలు ನಿಗದಿಪಡಿಸಲು ನಾವು ಇಷ್ಟಪಡುತ್ತೇವೆ. ಯಾವ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ ಸೂಕ್ತ?",
    general_inquiry: "ನಮಸ್ಕಾರ! ರೆನಿಕ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್ ಗೆ ಸ್ವಾಗತ. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    admin_contact: "ಪಾವತಿ, ಆರ್ಡರ್ ಸ್ಥಿತಿ ಅಥವಾ ನೇರ ಪ್ರಶ್ನೆಗಳಿಗಾಗಿ, ನಮ್ಮ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ:\n📞 {phone}\n\nಅವರು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತಾರೆ! 💎",
    product_selected: "ಉತ್ತಮ ಆಯ್ಕೆ! ನೀವು *{name}* ({price}) ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ನಿಮ್ಮ ಆರ್ಡರ್ ಅನ್ನು ಹೇಗೆ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?\n\n1. *ವೆಬ್‌ಸೈಟ್*: ಲಿಂಕ್ ಪಡೆಯಲು '1' ಎಂದು ಉತ್ತರಿಸಿ.\n2. *ಚಾಟ್*: ಇಲ್ಲಿಯೇ ಬುಕ್ ಮಾಡಲು '2' ಎಂದು ಉತ್ತರಿಸಿ.\n\nಮುಂದುವರೆಯಲು ದಯವಿಟ್ಟು '1' ಅಥವಾ '2' ರೊಂದಿಗೆ ಉತ್ತರಿಸಿ!",
    option_1_checkout: "ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ಆರ್ಡರ್ ಮಾಡಲು ಲಿಂಕ್:\n🔗 {productUrl}\n\nಹ್ಯಾಪಿ ಶಾಪಿಂಗ್! 💍",
    option_2_checkout: "ತುಂಬಾ ಒಳ್ಳೆಯದು! ನಾನು ಇಲ್ಲಿಯೇ ಚಾಟ್‌ನಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. 💍\n\nದಯವಿಟ್ಟು ಕಳುಹಿಸಿ:\n1. ನಿಮ್ಮ ಸೈಜ್ (ಅನ್ವಯಿಸಿದರೆ)\n2. ನಿಮ್ಮ ವಿಳಾಸ\n\nಈ ವಿವರಗಳ ನಂತರ ಬುಕ್ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ!",
    option_1_category: "ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಆಭರಣ ನೋಡಲು ಮತ್ತು ಆರ್ಡರ್ ಮಾಡಲು ಲಿಂಕ್:\n🔗 {categoryUrl}\n\nಹ್ಯಾಪಿ ಶಾಪಿಂಗ್! 💍",
    option_2_category: "ತುಂಬಾ ಒಳ್ಳೆಯದು! ನಾನು ಇಲ್ಲಿಯೇ ಚಾಟ್‌ನಲ್ಲಿ ಆರ್ಡರ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. 💍\n\nದಯವಿಟ್ಟು ಕಳುಹಿಸಿ:\n1. ವಿನ್ಯಾಸದ ಹೆಸರು ಅಥವಾ ಚಿತ್ರ\n2. ನಿಮ್ಮ ಸೈಜ್\n3. ನಿಮ್ಮ ವಿಳಾಸ\n\nಈ ವಿವರಗಳ ನಂತರ ಬುಕ್ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ!",
    metal_search_header: "ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ಕೆಲವು ಪ್ರಮುಖ *{metal}* ವಿನ್ಯಾಸಗಳು ಇಲ್ಲಿವೆ! 💍✨",
    metal_search_empty: "ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಸುಂದರವಾದ *{metal}* ಆಭರಣಗಳ ಸಂಗ್ರಹವಿದೆ! 💍✨\n\nಎಲ್ಲ ವಿನ್ಯಾಸಗಳನ್ನು ಇಲ್ಲಿ ನೋಡಬಹುದು:\n🔗 {searchUrl}\n\nಸಮಾಲೋಚನೆಗಾಗಿ ತಿಳಿಸಿ!",
    catalog_prompt: "ನಾವು ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಿಂದ (https://kanalli.in/) ನೇರವಾಗಿ ಪ್ರೀಮಿಯಂ ಆಭರಣಗಳನ್ನು ನೀಡುತ್ತಿದ್ದೇವೆ. ಇಂದು ನೀವು ಯಾವ ಸಂಗ್ರಹವನ್ನು ನೋಡಲು ಬಯಸುತ್ತೀರಿ?\n\n1. ಮಹಿಳೆಯರ ಸಂಗ್ರಹ (Women's Collection) 👩\n2. ಪುರುಷರ ಸಂಗ್ರಹ (Men's Collection) 👨\n3. ಉಡುಗೊರೆಗಳು (Gifts) 🎁\n\nದಯವಿಟ್ಟು ಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರಿನೊಂದಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿ!",
    category_header: "ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಿಂದ ಕೆಲವು ಪ್ರಮುಖ *{category}* ವಿನ್ಯಾಸಗಳು ಇಲ್ಲಿವೆ! 💍✨",
    category_empty: "ನಮ್ಮ ವೆಬ್‌ಸೈಟಿನಲ್ಲಿ *{category}* ಆಭರಣಗಳ ಸುಂದರವಾದ ಸಂಗ್ರಹವಿದೆ! 💍✨\n\nಎಲ್ಲ ವಿನ್ಯಾಸಗಳನ್ನು ಇಲ್ಲಿ ನೋಡಬಹುದು:\n🔗 {categoryUrl}\n\nಸಮಾಲೋಚನೆಗಾಗಿ ತಿಳಿಸಿ!",
    womens_submenu: "👩 *ಮಹಿ�ಳೆಯರ ಸಂಗ್ರಹ* 👩\nಇಂದು ನೀವು ಯಾವ ವರ್ಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ?\n\n1. ಬಳೆಗಳು (Bangle) ⭕\n2. ಓಲೆಗಳು (Earrings) 💎\n3. ಉಂಗುರಗಳು (Rings) 💍\n4. ಹಾರಗಳು (Necklace) 📿\n5. ಪೆಂಡೆಂಟ್‌ಗಳು (Pendant) 🎗️\n6. ಮೂಗುತಿಗಳು (Nose pins) 📍\n\nದಯವಿಟ್ಟು ಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರಿನೊಂದಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿ!\n(ಹಿಂದಿನ ಮೆನುಗೆ ಹೋಗಲು *back* ಎಂದು ಟೈಪ್ ಮಾಡಿ)",
    mens_submenu: "👨 *ಪುರುಷರ ಸಂಗ್ರಹ* 👨\nಇಂದು ನೀವು ಯಾವ ವರ್ಗವನ್ನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ?\n\n1. ಕೈಕಡಗಳು (Bracelet) 📿\n2. ಸರಗಳು (Chains) ⛓️\n3. ಉಂಗುರಗಳು (Rings) 💍\n\nದಯವಿಟ್ಟು ಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರಿನೊಂದಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿ!\n(ಹಿಂದಿನ ಮೆನುಗೆ ಹೋಗಲು *back* ಎಂದು ಟೈಪ್ ಮಾಡಿ)",
    product_caption: "*{idx}. {name}*\n💰 ಬೆಲೆ: {price}\n🔗 ವಿವರ ನೋಡಿ: {productUrl}",
    product_footer: "ಮೇಲೆ ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನ ಕೆಲವು ಪ್ರಮುಖ *{subcategory}* ವಿನ್ಯಾಸಗಳಿವೆ.\n\nಆರ್ಡರ್ ಆಯ್ಕೆಗಳಿಗಾಗಿ ಆಭರಣ ಸಂಖ್ಯೆಯೊಂದಿಗೆ (*1*, *2*, ಅಥವಾ *3*) ಉತ್ತರಿಸಿ, ಅಥವಾ ಹಿಂದಕ್ಕೆ ಹೋಗಲು *back* ಎಂದು ಟೈಪ್ ಮಾಡಿ! 🛍️",
    rings_gender_prompt: "ನೀವು ಉಂಗುರಗಳನ್ನು ಯಾರಿಗೆ ನೋಡಲು ಬಯಸುತ್ತೀರಿ:\n1. ಮಹಿಳೆಯರಿಗೆ (Women) 👩\n2. ಪುರುಷರಿಗೆ (Men) 👨\n3. ಉಡುಗೊರೆಗಳು (Gifts) 🎁\n\nದಯವಿಟ್ಟು *1*, *2* ಅಥವಾ *3* ರೊಂದಿಗೆ ಉತ್ತರಿಸಿ!",
    customization_reference: "ವಿನ್ಯಾಸದ ಚಿತ್ರವನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! 💍 ನಮ್ಮ ಆಭರಣ ವಿನ್ಯಾಸಕರು ನಿಮ್ಮ ಆಭರಣವನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಲು ಈ ಚಿತ್ರವನ್ನು ಪರಿಶೀಲಿಸಿ ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ."
  }
};class AIMessageAnalyzer {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || 'dummy_key';
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not set. AI analysis will be limited.');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-flash-latest' 
    });
  }

  localize(key, lang = 'en', data = {}) {
    const l = (lang || 'en').toLowerCase();
    const translations = LOCALIZATIONS[l] || LOCALIZATIONS['en'];
    let text = translations[key] || LOCALIZATIONS['en'][key] || '';
    
    // Simple interpolation
    for (const [k, v] of Object.entries(data)) {
      text = text.replace(new RegExp(`{${k}}`, 'g'), v);
    }
    return text;
  }

  /**
   * Helper to execute Gemini generation with rate-limit retry and exponential backoff
   */
  async generateContentWithRetry(prompt, retries = 5, initialDelay = 3000) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not set');
    }
    
    let delay = initialDelay;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.model.generateContent(prompt);
      } catch (err) {
        const errMsg = err.message || '';
        const isRateLimit = errMsg.includes('429') || 
                            errMsg.includes('Quota exceeded') || 
                            errMsg.includes('Too Many Requests') || 
                            errMsg.includes('RESOURCE_EXHAUSTED') || 
                            err.status === 429;
                            
        const isDailyLimit = errMsg.includes('GenerateRequestsPerDay') || 
                             errMsg.includes('limit: 20') ||
                             errMsg.includes('daily');
                            
        if (isRateLimit && !isDailyLimit && attempt < retries) {
          console.warn(`⚠️ Gemini API Rate Limit (429) hit. Retrying in ${(delay / 1000).toFixed(1)}s (Attempt ${attempt}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * Helper to load ShopConfig safely, supporting test fallback defaults
   */
  async getShopConfig(userId = null) {
    const defaultRules = {
      shopName: 'Renic Jewellers',
      websiteUrl: 'https://kanalli.in/',
      catalogImageUrl: 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
      customStartPrice: 8500,
      goldRate22K: 7200,
      goldRate24K: 7850,
      silverRate: 95,
      platinumRate: 3200,
      address: '123 Gold Bazaar, T. Nagar, Chennai, Tamil Nadu - 600017',
      operatingHours: '10:00 AM - 8:30 PM (Monday to Saturday)',
      contactPhone: '+91 9345578103',
      returnPolicy: '7-day replacement guarantee on manufacturing defects. 100% buyback guarantee at current gold rates.',
      aiCustomInstructions: 'Always sound extremely polite, warm, and helpful. Invite customers to consult on gold customization options.',
      faqs: [
        { question: "What is your gold purity guarantee?", answer: "All our jewelry is BIS Hallmark 916 certified, ensuring 22K gold purity." },
        { question: "Do you offer customization?", answer: "Yes, we custom craft bespoke bridal necklaces, rings, and bangles based on your design preferences." }
      ]
    };

    if (mongoose.connection.readyState === 0) {
      return defaultRules;
    }

    try {
      const ShopConfig = mongoose.model('ShopConfig');
      let config = null;
      if (userId) {
        config = await ShopConfig.findOne({ userId });
      }
      return config || defaultRules;
    } catch (err) {
      return defaultRules;
    }
  }

  /**
   * Helper to load catalog matches safely
   */
  async getMatchingCatalogItems(userId, queryText) {
    if (mongoose.connection.readyState === 0 || !userId || !queryText) {
      return [];
    }
    try {
      const CatalogItem = mongoose.model('CatalogItem');
      const keywords = queryText.toLowerCase().split(/\s+/);
      
      // Match by regex on name or category, or keyword search
      return await CatalogItem.find({
        userId,
        $or: [
          { name: { $regex: queryText, $options: 'i' } },
          { keywords: { $in: keywords.map(kw => new RegExp(kw, 'i')) } }
        ]
      }).limit(3).lean();
    } catch (err) {
      return [];
    }
  }

  detectGenderFromMessage(message) {
    const text = (message || '').toLowerCase().trim();
    const womenKeywords = ['women', "women's", 'womens', 'woman', 'lady', 'ladies', 'girl', 'girls', 'female', 'महिला', 'महिलाएं', 'பெண்', 'பெண்கள்', 'మహిళ', 'మహిళలు', 'ಮಹಿಳೆ', 'ಮಹಿಳೆಯರು', 'स्त्री', 'स्त्रिया'];
    const menKeywords = ['men', "men's", 'mens', 'man', 'gent', 'gents', 'boy', 'boys', 'male', 'पुरुष', 'ஆண்', 'ஆண்கள்', 'పురుషుడు', 'పురుషులు', 'ಪುರುಷ', 'ಪುರುಷರು'];
    
    const hasWomen = womenKeywords.some(kw => text.includes(kw));
    const hasMen = menKeywords.some(kw => text.includes(kw));
    
    if (hasWomen && !hasMen) return 'WOMEN';
    if (hasMen && !hasWomen) return 'MEN';
    return null;
  }

  async detectCategorySelection(message, websiteUrl = null) {
    const text = (message || '').toLowerCase().trim();
    
    // Exclude rate/price inquiries
    const hasRateKeyword = ['rate', 'price', 'today', 'how much', 'cost', 'value', 'per gram'].some(kw => text.includes(kw));
    if (hasRateKeyword) return null;

    if (['new in', 'new arrivals', "what's new", 'whats new', 'latest', 'recently launched', 'new collection'].some(k => text.includes(k))) return 'NEW_IN';
    if (['best seller', 'best sellers', 'bestseller', 'popular', 'trending', 'hot selling', 'top selling'].some(k => text.includes(k))) return 'BEST_SELLER';
    if (['all products', 'show all products', 'everything', 'full range', 'complete collection'].some(k => text.includes(k))) return 'ALL_PRODUCTS';
    if (['gift for husband', 'gift for boyfriend', 'gift for dad', 'gift for father', 'gift for brother', 'anniversary gift for husband'].some(k => text.includes(k))) return 'BRACELET';
    if (['gift for wife', 'gift for girlfriend', 'gift for mom', 'gift for mother', 'gift for sister', 'birthday gift for wife'].some(k => text.includes(k))) return 'EARRINGS';
    if (['gift', 'gifts', 'present', 'baby shower', 'maternity gift', 'retirement gift', 'graduation gift', 'anniversary gift', 'birthday present'].some(k => text.includes(k))) return 'GIFTS';
    if (['wedding jewelry', 'bridal set', 'bridal jewellery', 'temple jewelry', 'temple jewellery', 'party wear jewelry', 'party wear jewellery'].some(k => text.includes(k))) return 'NECKLACES';
    if (['office wear', 'lightweight', 'small earrings'].some(k => text.includes(k))) return 'EARRINGS';
    if (['something for daily use', 'daily use jewelry', 'daily use jewellery'].some(k => text.includes(k))) return 'PENDANT';

    // SHOW_MORE only if explicitly asked, not just "5"
    if ((text.includes('show more') || text.includes('view all') || text.includes('more')) && !['5', '1', '2', '3', '4', '6'].includes(text)) return 'SHOW_MORE';

    // 1. Try dynamic matching if websiteUrl is provided
    if (websiteUrl) {
      try {
        const dynamicKeywords = await this.getDynamicCategoryKeywords(websiteUrl);
        for (const dk of dynamicKeywords) {
          if (['men', 'women', 'gifts', 'gift'].includes(dk.word)) continue;
          
          const regex = new RegExp(`\\b${dk.word}s?\\b`, 'i');
          if (regex.test(text)) {
            return dk.category;
          }
        }
      } catch (err) {
        console.warn('[Dynamic Categories] Matching failed:', err.message);
      }
    }

    // 2. Multilingual Static Matcher
    if (text.includes('ring') || text === '1' || text.startsWith('1.') || text.includes('rings') || text.includes('अंगूठी') || text.includes('மோதிர') || text.includes('ఉంగర') || text.includes('अंगठ्या') || text.includes('ಉಂಗುರ')) return 'RINGS';
    if (text.includes('necklace') || text === '2' || text.startsWith('2.') || text.includes('necklaces') || text.includes('हार') || text.includes('நெக்லஸ்') || text.includes('నెక్లెస్') || text.includes('ಹಾರ')) return 'NECKLACES';
    if (text.includes('bangle') || text === '3' || text.startsWith('3.') || text.includes('bangles') || text.includes('चूड़ी') || text.includes('வளையல்') || text.includes('గాజు') || text.includes('बांगड्या') || text.includes('ಬಳೆ')) return 'BANGLES';
    if (text.includes('earring') || text === '4' || text.startsWith('4.') || text.includes('earrings') || text.includes('झुमके') || text.includes('கம்மல்') || text.includes('చెవి') || text.includes('ओಲೆ')) return 'EARRINGS';
    if (text.includes('pendant') || text === '5' || text.startsWith('5.') || text.includes('pendants') || text.includes('पेंडेंट') || text.includes('பதக்கம்') || text.includes('లాకెட்') || text.includes('ಪೆಂಡೆಂಟ್') || text.includes('పెండెంట్')) return 'PENDANT';
    if (text.includes('nose') || text === '6' || text.startsWith('6.') || text.includes('नाक') || text.includes('மூக்கு') || text.includes('முக்கு') || text.includes('ನತ್') || text.includes('ಮೂಗು')) return 'NOSE_PINS';
    if (text.includes('bracelet') || text.includes('bracelets') || text.includes('कंगन') || text.includes('காப்பு') || text.includes('బ్రాస్లెట్') || text.includes('कडे') || text.includes('ಕೈಕಡ')) return 'BRACELET';
    if (text.includes('chain') || text.includes('chains') || text.includes('चेन') || text.includes('செயின்') || text.includes('చైన్') || text.includes('ಸರ')) return 'CHAINS';
    
    if (text.includes('💍')) return 'RINGS';
    if (text.includes('📿') || text.includes('⛓')) return 'NECKLACES';
    if (text.includes('⭕')) return 'BANGLES';

    // Pattern-based category detection for common phrases like "daily wear", "everyday wear"
    if (text.includes('daily wear') || text.includes('everyday') || text.includes('daily use') || text.includes('for daily')) return 'BANGLES';

    return null;
  }

  async fetchCategoryPathsFromWebsite(websiteUrl) {
    if (!websiteUrl) return [];
    const normalizedUrl = websiteUrl.endsWith('/') ? websiteUrl : `${websiteUrl}/`;
    if (!this.dynamicCategoriesCache) {
      this.dynamicCategoriesCache = {};
    }
    const cached = this.dynamicCategoriesCache[normalizedUrl];
    const cacheDuration = 24 * 60 * 60 * 1000;
    if (cached && (Date.now() - cached.fetchedAt < cacheDuration)) {
      return cached.paths;
    }
    try {
      const axios = require('axios');
      const response = await axios.get(normalizedUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const html = response.data;
      const regex = /href="([^"]*product-category\/[^"]*)"/g;
      const paths = new Set();
      let match;
      while ((match = regex.exec(html)) !== null) {
        paths.add(match[1]);
      }
      const pathsArray = Array.from(paths);
      this.dynamicCategoriesCache[normalizedUrl] = {
        paths: pathsArray,
        fetchedAt: Date.now()
      };
      return pathsArray;
    } catch (err) {
      console.warn(`[Dynamic Categories] Scrape homepage failed: ${err.message}`);
      return [];
    }
  }

  async getDynamicCategoryKeywords(websiteUrl) {
    const paths = await this.fetchCategoryPathsFromWebsite(websiteUrl);
    const keywords = [];
    for (const path of paths) {
      const cleanPath = path.replace(/\/$/, '');
      const segment = cleanPath.split('/product-category/')[1];
      if (!segment) continue;
      const parts = segment.split('/');
      const last = parts[parts.length - 1];
      if (last) {
        const baseWord = last.replace(/-men$/, '').replace(/-women$/, '').toLowerCase();
        let baseCategory = baseWord.toUpperCase().replace(/-/g, '_');
        // Standardize plural/singular names for category routing
        if (baseCategory === 'CHAIN') baseCategory = 'CHAINS';
        if (baseCategory === 'RING') baseCategory = 'RINGS';
        if (baseCategory === 'NECKLACE') baseCategory = 'NECKLACES';
        if (baseCategory === 'BANGLE') baseCategory = 'BANGLES';
        
        keywords.push({
          word: baseWord,
          category: baseCategory,
          path: path.split(websiteUrl)[1] || path
        });
      }
    }
    return keywords;
  }

  async getDynamicCategoryPath(gender, subcategory, websiteUrl) {
    const genUpper = (gender || '').toUpperCase();
    const subUpper = (subcategory || '').toUpperCase();
    if (websiteUrl) {
      try {
        const paths = await this.fetchCategoryPathsFromWebsite(websiteUrl);
        if (paths && paths.length > 0) {
          for (const p of paths) {
            const cleanPath = p.replace(/\/$/, '');
            const segment = cleanPath.split('/product-category/')[1];
            if (!segment) continue;
            const parts = segment.split('/');
            let pathGender = 'WOMEN';
            if (parts.includes('men')) pathGender = 'MEN';
            else if (parts.includes('gifts') || parts.includes('gift')) pathGender = 'GIFTS';
            if (pathGender !== genUpper) continue;
            const lastSegment = parts[parts.length - 1]?.toLowerCase() || '';
            const subLower = subUpper.toLowerCase();
            const isMatch = lastSegment === subLower || 
                            lastSegment.includes(subLower) || 
                            subLower.includes(lastSegment) ||
                            (subLower === 'rings' && lastSegment.includes('ring')) ||
                            (subLower === 'necklace' && lastSegment.includes('necklace')) ||
                            (subLower === 'necklace' && lastSegment.includes('necklaces')) ||
                            (subLower === 'bangle' && lastSegment.includes('bangle')) ||
                            (subLower === 'bangle' && lastSegment.includes('bangles')) ||
                            (subLower === 'earring' && lastSegment.includes('earring')) ||
                            (subLower === 'earring' && lastSegment.includes('earrings')) ||
                            (subLower === 'pendant' && lastSegment.includes('pendant')) ||
                            (subLower === 'pendant' && lastSegment.includes('pendants')) ||
                            (subLower === 'nose_pins' && (lastSegment.includes('nose') || lastSegment.includes('pin'))) ||
                            (subLower === 'bracelet' && lastSegment.includes('bracelet')) ||
                            (subLower === 'chains' && lastSegment.includes('chain'));
            if (isMatch) {
              const relPath = p.split('/product-category/')[1];
              return relPath ? `product-category/${relPath}` : p;
            }
          }
        }
      } catch (err) {
        console.warn('[Dynamic Categories] Failed to resolve path dynamically:', err.message);
      }
    }
    return this.getCategoryPath(gender, subcategory);
  }

    parsePrice(priceText) {
    if (!priceText) return 0;
    const clean = priceText.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  extractPriceFilter(message) {
    const text = (message || '').toLowerCase().trim();
    let minPrice = null;
    let maxPrice = null;

    // 1. Scale thousands decimal first: e.g. 2.5k -> 2500
    let cleanText = text.replace(/(\d+)\.(\d+)\s*k\b/gi, (match, p1, p2) => {
      const scale = p2.padEnd(3, '0').substring(0, 3);
      return p1 + scale;
    });
    // 2. Scale thousands integer next: e.g. 10k -> 10000
    cleanText = cleanText.replace(/(\d+)\s*k\b/gi, (match, p1) => p1 + '000');

    // 3. Scale lakhs decimal first: e.g. 1.5L -> 150000
    cleanText = cleanText.replace(/(\d+)\.(\d+)\s*(?:l|lakhs?)\b/gi, (match, p1, p2) => {
      const scale = p2.padEnd(5, '0').substring(0, 5);
      return p1 + scale;
    });
    // 4. Scale lakhs integer next: e.g. 1lakh -> 100000
    cleanText = cleanText.replace(/(\d+)\s*(?:l|lakhs?)\b/gi, (match, p1) => p1 + '00000');

    // Remove commas from numbers
    cleanText = cleanText.replace(/(\d),(\d)/g, '$1$2');

    // 1. Match range: "between 2000 and 5000"
    const rangeMatch = cleanText.match(/(?:between|from)?\s*(?:rs\.?|₹)?\s*(\d+)\s*(?:to|and|-|से|முதல்|నుండి|ఇんだ|ಇಂದ|ಕಿ)\s*(?:rs\.?|₹)?\s*(\d+)/i);
    if (rangeMatch) {
      const val1 = parseInt(rangeMatch[1], 10);
      const val2 = parseInt(rangeMatch[2], 10);
      if (val1 < val2) {
        minPrice = val1;
        maxPrice = val2;
      } else {
        minPrice = val2;
        maxPrice = val1;
      }
      return { minPrice, maxPrice };
    }

    // 2. Match under/max limit (including regional equivalents)
    const underMatch = cleanText.match(/(?:under|below|less than|within|max|maximum|up\s*to|upto|के अंदर|के नीचे|से कम|குறைந்த|கீழ்|க்குள்|లోపు|తక్కువ|ఒಳಗಿನ|ಕಡಿಮೆ)\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
                       cleanText.match(/(?:rs\.?|₹)?\s*(\d+)\s*(?:under|below|max|maximum|के अंदर|के नीचे|से कम|குறைந்த|கீழ்|க்குள்|లోపు|తక్కువ|ఒಳಗಿನ|ಕಡಿಮೆ)/i);
    if (underMatch) {
      maxPrice = parseInt(underMatch[1], 10);
      return { minPrice, maxPrice };
    }

    // 3. Match starting/above limit
    const aboveMatch = cleanText.match(/(?:above|greater than|more than|min|minimum|starting|starts?|से शुरू|இருந்து|నుండి|ఇంద)\s*(?:from)?\s*(?:rs\.?|₹)?\s*(\d+)/i) ||
                       cleanText.match(/(?:rs\.?|₹)?\s*(\d+)\s*(?:above|greater|more|starting|से शुरू|இருந்து|నుండి|ఇంద)/i);
    if (aboveMatch) {
      minPrice = parseInt(aboveMatch[1], 10);
      return { minPrice, maxPrice };
    }

    // 4. Fallback budget match (supporting optional transition words like "is", "are", "around", "of", ":", "=")
    const budgetMatch = cleanText.match(/(?:budget|rs\.?|₹|for|of)\s*(?:is|are|around|of|:|=)?\s*(\d+)/i);
    if (budgetMatch) {
      maxPrice = parseInt(budgetMatch[1], 10);
      return { minPrice, maxPrice };
    }

    // 5. Plain number match (if message is just a number >= 100, e.g. "3000", "5000", "10k" / "10000")
    const plainNumberMatch = cleanText.match(/^\s*(?:rs\.?|₹)?\s*(\d+)\s*(?:\/-)?\s*$/i);
    if (plainNumberMatch) {
      const val = parseInt(plainNumberMatch[1], 10);
      if (val >= 100) {
        maxPrice = val;
        return { minPrice, maxPrice };
      }
    }

    return { minPrice, maxPrice };
  }

  getBudgetHeader(priceFilter, category, language, minAvailablePrice = null) {
    const catLower = (category || 'products').toLowerCase();
    
    if (minAvailablePrice !== null) {
      const formattedMin = `₹${minAvailablePrice.toLocaleString('en-IN')}`;
      if (priceFilter.maxPrice !== null) {
        return this.localize('budget_empty', language, { category: catLower, maxPrice: priceFilter.maxPrice, minAvailablePrice: formattedMin });
      }
      return this.localize('budget_range_empty', language, { category: catLower, minAvailablePrice: formattedMin });
    }

    if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
      return this.localize('budget_range_match', language, { category: catLower, minPrice: priceFilter.minPrice, maxPrice: priceFilter.maxPrice });
    } else if (priceFilter.maxPrice !== null) {
      return this.localize('budget_match', language, { category: catLower, maxPrice: priceFilter.maxPrice });
    } else if (priceFilter.minPrice !== null) {
      return this.localize('budget_above_match', language, { category: catLower, minPrice: priceFilter.minPrice });
    }
    return null;
  }

  applyPriceFilter(products, filter) {
    if (!products || products.length === 0) return [];
    let filtered = products.filter(p => {
      const parsed = this.parsePrice(p.price);
      if (parsed === 0) return true; // keep contact for price
      if (filter.minPrice !== null && parsed < filter.minPrice) return false;
      if (filter.maxPrice !== null && parsed > filter.maxPrice) return false;
      return true;
    });
    
    // If we filtered out everything, fall back to returning closest available designs
    if (filtered.length === 0) {
      return products.slice(0, 3);
    }
    return filtered.slice(0, 3);
  }

  getTemplateCategoryForIntent(intent) {
    const mappings = {
      general_inquiry: 'WELCOME',
      purchase_intent: 'PRODUCT_RECOMMENDATION',
      delivery_query: 'SHIPPING_UPDATE',
      customization: 'CUSTOM',
      complaint: 'FEEDBACK_REQUEST'
    };
    return mappings[intent] || null;
  }

getCategoryPath(gender, subcategory) {
    const genUpper = (gender || '').toUpperCase();
    const subUpper = (subcategory || '').toUpperCase();

    if (subUpper === 'NEW_IN') return 'product-category/new-in/';
    if (subUpper === 'BEST_SELLER') return 'product-category/best-seller/';
    if (subUpper === 'ALL_PRODUCTS' || subUpper === 'SHOW_MORE') return 'product-category/all-products/';
    if (subUpper === 'GIFTS' || subUpper === 'GIFT') return 'product-category/gifts/';
    
    if (genUpper === 'WOMEN') {
      if (subUpper === 'BANGLE') return 'product-category/women/bangle/';
      if (subUpper === 'EARRINGS') return 'product-category/women/earrings/';
      if (subUpper === 'RINGS') return 'product-category/women/rings/';
      if (subUpper === 'NECKLACE' || subUpper === 'NECKLACES') return 'product-category/women/necklace/';
      if (subUpper === 'PENDANT' || subUpper === 'PENDANTS') return 'product-category/women/pendant/';
      if (subUpper === 'NOSE_PINS' || subUpper === 'NOSE PINS' || subUpper === 'NOSE PIN') return 'product-category/women/nose-pins/';
    } else if (genUpper === 'MEN') {
      if (subUpper === 'BRACELET' || subUpper === 'BRACELETS') return 'product-category/men/bracelet-men/';
      if (subUpper === 'CHAINS' || subUpper === 'CHAIN') return 'product-category/men/chains/';
      if (subUpper === 'RINGS') return 'product-category/men/rings-men/';
    } else if (genUpper === 'GIFTS') {
      return 'product-category/gifts/';
    }
    return '';
  }

  async scrapeProductsFromUrl(websiteUrl, gender, subcategory) {
    if (!websiteUrl || !gender) return [];
    
    // Backward compatibility: if only 2 args passed, e.g. scrapeProductsFromUrl(url, 'RINGS')
    let activeGender = gender;
    let activeSub = subcategory;
    if (!subcategory) {
      activeGender = 'WOMEN';
      activeSub = gender;
    }

    try {
      const axios = require('axios');
      const base = websiteUrl.endsWith('/') ? websiteUrl : `${websiteUrl}/`;
      const path = await this.getDynamicCategoryPath(activeGender, activeSub, websiteUrl);
      if (!path) return [];
      
      const targetUrl = `${base}${path}`;
      console.log(`[Scraper] Fetching live products from: ${targetUrl}`);
      
      const response = await axios.get(targetUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      const html = response.data;
      const products = [];
      
      const productRegex = /<li[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
      let match;
      let count = 0;
      
      while ((match = productRegex.exec(html)) !== null && count < 12) {
        const fullTag = match[0];
        const block = match[1];
        
        // Skip WooCommerce subcategory list items
        if (fullTag.includes('product-category')) {
          continue;
        }

        const titleMatch = block.match(/<h[345][^>]*class="[^"]*title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                           block.match(/<a[^>]*class="[^"]*LoopProduct-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
                           block.match(/<h[345][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                           block.match(/<a[^>]*href=[^>]*>([\s\S]*?)<\/a>/i);
        
        const priceMatch = block.match(/<ins[^>]*>([\s\S]*?)<\/ins>/i) ||
                           block.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        
        const imgMatch = block.match(/<img[^>]*src="([^"]+)"/i) || block.match(/<img[^>]*data-lazy-src="([^"]+)"/i);
        
        // Extract specific product detail link
        const urlMatch = block.match(/<a[^>]*href=["']([^"']*)["']/i);
        const productUrl = urlMatch ? urlMatch[1] : targetUrl;

        let title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        let price = 'Contact for Price';
        
        if (priceMatch) {
          let priceText = priceMatch[1] || priceMatch[0];
          priceText = priceText.replace(/<[^>]*>/g, '')
                               .replace(/&#8377;/g, '₹')
                               .replace(/&nbsp;/g, ' ')
                               .replace(/\s+/g, ' ')
                               .trim();
          if (priceText) price = priceText;
        }
        
        let imageUrl = imgMatch ? imgMatch[1] : '';
        
        if (title) {
          products.push({
            name: title,
            price: price,
            imageUrl: imageUrl,
            productUrl: productUrl
          });
          count++;
        }
      }
      
      return products;
    } catch (err) {
      console.warn(`[Scraper] Live fetch failed for category ${activeSub || activeGender}:`, err.message);
      return [];
    }
  }

  async handleCategoryCatalogResponse(selectedCategory, userId, config, language, customerProfile = null, forcedGender = null, messageBody = '') {
    const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
    
    if (selectedCategory === 'SHOW_MORE') {
      const replyText = this.localize('show_more_catalog', language, { collectionsUrl: `${base}product-category/all-products/` });

      return {
        success: true,
        text: replyText,
        mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
        scrapedProducts: [],
        language,
        generatedAt: new Date()
      };
    }

    let gender = forcedGender;
    const catUpper = selectedCategory.toUpperCase();
    
    if (catUpper === 'RINGS' && !gender) {
      // Check if messageBody contains explicit gender keyword
      const explicitGender = this.detectGenderFromMessage(messageBody);
      if (explicitGender) {
        gender = explicitGender;
      } else {
        // No explicit gender - we must prompt them!
        if (customerProfile) {
          const Customer = mongoose.model('Customer');
          const priceFilter = this.extractPriceFilter(messageBody);
          const hasPriceFilter = priceFilter.minPrice !== null || priceFilter.maxPrice !== null;
          
          const newState = {
            menuLevel: 'RINGS_GENDER_SELECT',
            priceFilter: hasPriceFilter ? priceFilter : null
          };
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': newState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = newState;
          }
        }
        
        return {
          success: true,
          text: this.localize('rings_gender_prompt', language),
          language,
          generatedAt: new Date()
        };
      }
    }

    if (!gender) {
      gender = 'WOMEN';
      if (catUpper === 'GIFTS' || catUpper === 'GIFT') {
        gender = 'GIFTS';
      }
      if (catUpper === 'BRACELET' || catUpper === 'CHAINS') {
        gender = 'MEN';
      }
    }

    const path = await this.getDynamicCategoryPath(gender, selectedCategory, config.websiteUrl);
    const categoryUrl = `${base}${path}`;

    // Scrape live website using shop's configured URL
    const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', gender, selectedCategory);

    // Extract price filter from messageBody or use customer state
    const priceFilter = this.extractPriceFilter(messageBody);
    const hasPriceFilter = priceFilter.minPrice !== null || priceFilter.maxPrice !== null;
    const activeFilter = hasPriceFilter ? priceFilter : (customerProfile?.customFields?.catalogState?.priceFilter || null);

    let liveProducts = [];
    let customHeader = null;

    if (activeFilter) {
      const actualMatches = rawProducts.filter(p => {
        const parsed = this.parsePrice(p.price);
        if (parsed === 0) return true;
        if (activeFilter.minPrice !== null && parsed < activeFilter.minPrice) return false;
        if (activeFilter.maxPrice !== null && parsed > activeFilter.maxPrice) return false;
        return true;
      });

      if (actualMatches.length > 0) {
        liveProducts = actualMatches.slice(0, 3);
        customHeader = this.getBudgetHeader(activeFilter, selectedCategory, language);
      } else {
        liveProducts = rawProducts.slice(0, 3);
        const prices = rawProducts.map(p => this.parsePrice(p.price)).filter(pr => pr > 0);
        const minAvailablePrice = prices.length > 0 ? Math.min(...prices) : null;
        customHeader = this.getBudgetHeader(activeFilter, selectedCategory, language, minAvailablePrice);
      }
    } else {
      liveProducts = rawProducts.slice(0, 3);
    }

    const websiteImage = (liveProducts && liveProducts.length > 0 && liveProducts[0].imageUrl)
      ? liveProducts[0].imageUrl
      : (config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png');

    if (liveProducts && liveProducts.length > 0) {
      if (customerProfile) {
        const Customer = mongoose.model('Customer');
        const newState = {
          menuLevel: 'PRODUCTS',
          gender: gender,
          subcategory: selectedCategory,
          products: liveProducts,
          priceFilter: activeFilter
        };
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.catalogState': newState
        });
        if (customerProfile.customFields) {
          customerProfile.customFields.catalogState = newState;
        }
      }
      const textHeader = this.localize('category_header', language, { category: selectedCategory.toLowerCase() }) + '\n\n';
      const productsList = liveProducts.map((p, idx) => 
        `*${idx + 1}. ${p.name}*\n💰 ${language === 'hi' ? 'कीमत' : language === 'ta' ? 'விலை' : 'Price'}: ${p.price}\n🔗 ${language === 'hi' ? 'विवरण देखें' : language === 'ta' ? 'விவரம் பார்க்க' : 'View details'}: ${p.productUrl}`
      ).join('\n\n');
      
      const textFooter = `\n\n${language === 'hi' ? 'हमारी वेबसाइट पर अधिक डिज़ाइन देखें' : language === 'ta' ? 'எங்கள் இணையதளத்தில் மேலும் வடிவமைப்புகளை ஆராயுங்கள்' : 'Explore more designs on our website'}:\n🔗 ${categoryUrl}\n\n${language === 'hi' ? 'यदि आपको इनमें से किसी भी पीस का विवरण चाहिए तो मुझे बताएं!' : language === 'ta' ? 'இந்த நகைகளில் ஏدهனும் ವಿವರங்கள் ಬೇಕಿದ್ದರೆ ತಿಳಿಸಿ!' : 'Let me know if you would like details on any of these pieces!'}`;
      
      return {
        success: true,
        text: `${textHeader}${productsList}${textFooter}`,
        customHeader,
        mediaUrl: websiteImage,
        scrapedProducts: liveProducts,
        language,
        generatedAt: new Date()
      };
    } else {
      // Fallback to local MongoDB items if website is empty
      let localItems = [];
      try {
        const CatalogItem = mongoose.model('CatalogItem');
        localItems = await CatalogItem.find({ userId, category: selectedCategory }).limit(3).lean();
      } catch (err) {
        console.warn('Failed to load local catalog fallback items:', err.message);
      }
      
      if (localItems && localItems.length > 0) {
        if (customerProfile) {
          const Customer = mongoose.model('Customer');
          const newState = {
            menuLevel: 'PRODUCTS',
            gender: gender,
            subcategory: selectedCategory,
            products: localItems
          };
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': newState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = newState;
          }
        }
        const textHeader = this.localize('category_header', language, { category: selectedCategory.toLowerCase() }) + '\n\n';
        const productsList = localItems.map((p, idx) => 
          `*${idx + 1}. ${p.name}*\n💰 ${language === 'hi' ? 'कीमत' : language === 'ta' ? 'விலை' : 'Price'}: ₹${p.price}\n🔗 ${language === 'hi' ? 'विवरण देखें' : language === 'ta' ? 'விவரம் பார்க்க' : 'View details'}: ${categoryUrl}`
        ).join('\n\n');
        
        const textFooter = `\n\n${language === 'hi' ? 'हमारी वेबसाइट पर अधिक डिज़ाइन देखें' : language === 'ta' ? 'எங்கள் இணையதளத்தில் மேலும் வடிவமைப்புகளை ஆராயுங்கள்' : 'Explore more designs on our website'}:\n🔗 ${categoryUrl}`;
        
        return {
          success: true,
          text: `${textHeader}${productsList}${textFooter}`,
          mediaUrl: websiteImage,
          scrapedProducts: localItems,
          language,
          generatedAt: new Date()
        };
      } else {
        const replyText = this.localize('category_empty', language, { category: selectedCategory.toLowerCase(), categoryUrl });
        
        return {
          success: true,
          text: replyText,
          mediaUrl: websiteImage,
          scrapedProducts: [],
          language,
          generatedAt: new Date()
        };
      }
    }
  }

  detectLanguage(text) {
    const scripts = {
      ta: /[\u0B80-\u0BFF]/,
      te: /[\u0C00-\u0C7F]/,
      gu: /[\u0A80-\u0AFF]/,
      kn: /[\u0C80-\u0CFF]/,
      ml: /[\u0D00-\u0D7F]/,
      pa: /[\u0A00-\u0A7F]/,
      ur: /[\u0600-\u06FF]/
    };

    for (const [lang, regex] of Object.entries(scripts)) {
      if (regex.test(text)) {
        return lang;
      }
    }

    // Check Devanagari script (used by Hindi and Marathi)
    if (/[\u0900-\u097F]/.test(text)) {
      // Check for Marathi-specific character ळ or helper words/suffixes
      if (/[\u0933]|आहे|किती|च्या|ला|सोन्या|कंगना|पण|का/.test(text)) {
        return 'mr';
      }
      return 'hi';
    }

    if (/[a-zA-Z]/.test(text)) {
      return 'en';
    }

    return 'en';
  }

  /**
   * Analyze customer message for intent, sentiment, budget, name extraction, etc.
   */
  async analyzeMessage(message, conversationHistory = [], customerProfile = null, mediaUrl = null) {
    try {
      const normalizedMessage = typeof message === 'string' ? message : '';

      if (mediaUrl && this.isReferenceImageMessage(normalizedMessage)) {
        const mediaAnalysis = this.getFallbackAnalysis(normalizedMessage);
        return {
          ...mediaAnalysis,
          intent: 'customization',
          productInterest: mediaAnalysis.productInterest || 'shared design reference',
          keyPoints: [...(mediaAnalysis.keyPoints || []), 'Customer shared a design reference image'],
          mediaUrl,
          detectedAt: new Date()
        };
      }

      if (!process.env.GEMINI_API_KEY) {
        const fallback = this.getFallbackAnalysis(normalizedMessage);
        if (mediaUrl) {
          fallback.mediaUrl = mediaUrl;
          if (this.isReferenceImageMessage(normalizedMessage)) {
            fallback.intent = 'customization';
            fallback.productInterest = fallback.productInterest || 'shared design reference';
            fallback.keyPoints = [...(fallback.keyPoints || []), 'Customer shared a design reference image'];
          }
        }
        return fallback;
      }

      const language = this.detectLanguage(normalizedMessage);
      const historyContext = this.buildHistoryContext(conversationHistory);
      const customerContext = customerProfile ? this.buildCustomerContext(customerProfile) : '';
      const mediaContext = mediaUrl
        ? `MEDIA ATTACHMENT:
- Customer shared a media attachment at: ${mediaUrl}
- If the text is empty, minimal, or refers to "this design/image/photo", treat it as a shared design reference and prefer "customization" intent.`
        : 'MEDIA ATTACHMENT: None';

      const prompt = `
You are an AI assistant analyzing customer messages for Renic Jewellers.

CUSTOMER MESSAGE:
"${normalizedMessage}"

${historyContext}
${customerContext}
${mediaContext}

Analyze this message and return a JSON object with:
{
  "intent": "one of: purchase_intent, customization, consultation_booking, payment_options, complaint, stock_check, product_info, delivery_query, price_inquiry, warranty, general_inquiry",
  "sentiment": "POSITIVE, NEUTRAL, or NEGATIVE",
  "urgency": "urgent, high, medium, low",
  "timeline": "today, this_week, this_month, next_month, not_specified",
  "occasion": "wedding, engagement, anniversary, birthday, festival, gift, bridal, not_specified",
  "stageInJourney": "awareness, consideration, decision, post_purchase",
  "explicitBudget": null or number (in rupees),
  "budgetRange": "low (0-25k), medium (25-50k), high (50-100k), premium (100k+), not_mentioned",
  "productInterest": "specific product name or null",
  "followUpNeeded": true or false,
  "keyPoints": ["array of important points from the message"],
  "extractedName": null or { "firstName": "Firstname", "lastName": "Lastname" }
}

*CRITICAL NAME EXTRACTION RULE: Check if the customer explicitly provides their name in the message (e.g. "I am Priya Sharma", "My name is Rajesh", "Rajesh here"). If so, extract it into "extractedName". If no name is mentioned, "extractedName" must be null.

Return ONLY valid JSON, no markdown or extra text.`;

      const result = await this.generateContentWithRetry(prompt);
      const responseText = result.response.text();
      
      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getFallbackAnalysis(message);
      }

      const analysis = JSON.parse(jsonMatch[0]);
      analysis.language = language;
      if (mediaUrl) {
        analysis.mediaUrl = mediaUrl;
      }
      analysis.detectedAt = new Date();

      return analysis;
    } catch (error) {
      console.error('AI Analysis Error:', error.message);
      const fallback = this.getFallbackAnalysis(typeof message === 'string' ? message : '');
      if (mediaUrl) {
        fallback.mediaUrl = mediaUrl;
        if (this.isReferenceImageMessage(message)) {
          fallback.intent = 'customization';
          fallback.productInterest = fallback.productInterest || 'shared design reference';
          fallback.keyPoints = [...(fallback.keyPoints || []), 'Customer shared a design reference image'];
        }
      }
      return fallback;
    }
  }

  /**
   * Build conversation history context
   */
  buildHistoryContext(history) {
    if (!history || history.length === 0) {
      return 'CONVERSATION HISTORY: None (first message)';
    }

    const recentMessages = history.slice(-5).map(msg => {
      const senderLabel = msg.aiGenerated ? 'AI' : 'Customer';
      const content = msg.content || '';
      const mediaNote = msg.mediaUrl ? ` [shared image: ${msg.mediaUrl}]` : '';
      return `${senderLabel}: ${content}${mediaNote}`;
    }).join('\n');

    return `CONVERSATION HISTORY (last 5 messages):\n${recentMessages}`;
  }

  /**
   * Build customer profile context
   */
  buildCustomerContext(customer) {
    if (!customer) return '';

    return `CUSTOMER PROFILE:
- Name: ${customer.firstName} ${customer.lastName}
- Total Orders: ${customer.totalPurchases}
- Total Spent: ₹${customer.totalSpent}
- Segment: ${customer.rfmSegment}
- Preferred Language: ${customer.language}
- Last Purchase: ${customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : 'Never'}`;
  }

  /**
   * Fallback analysis when AI fails
   */
  getFallbackAnalysis(message) {
    const lowerMessage = message.toLowerCase();
    
    // Multilingual keywords for fallback intent matching
    const priceKeywords = [
      'price', 'cost', 'rate', 'how much', 'rates', 'charges', 'value', 'gold', 'silver', 'platinum', '22k', '24k', '916', '91.6',
      'कीमत', 'भाव', 'मूल्य', 'कितने', 'रेट',
      'விலை', 'மதிப்பு', 'எவ்வளவு',
      'ధర', 'ఖరీదు', 'ఎంత',
      'ಬೆಲೆ', 'ಎಷ್ಟು',
      'કેટલા', 'કિંમત',
      'ਕੀਮਤ', 'ਕਿੰਨੇ',
      'വില', 'എത്ര'
    ];
    const customKeywords = [
      'custom', 'design', 'make', 'bespoke', 'craft',
      'डिज़ाइन', 'बनाना', 'कस्टम', 'बना',
      'வடிவமைப்பு', 'தயாரிப்பு',
      'ఖరీదు', 'డిజైన్'
    ];
    const purchaseKeywords = [
      'buy', 'order', 'purchase', 'pay', 'want to buy',
      'खरीदना', 'ऑर्डर', 'लेना',
      'வாங்க', 'கொள்முதல்'
    ];
    const deliveryKeywords = [
      'delivery', 'shipping', 'track', 'where is my', 'days ago',
      'डिलीवरी', 'ट्रैक', 'कहाँ',
      'டெலிவரி', 'டிராக்கிங்'
    ];
    const complaintKeywords = [
      'complaint', 'issue', 'problem', 'broken', 'loose', 'damage', 'disappointed', 'worst',
      'शिकायत', 'खराब', 'टूटा', 'नुकसान',
      'புகார்', 'பிரச்சனை', 'சேதம்'
    ];
    const bookingKeywords = [
      'appointment', 'book', 'visit', 'consultation',
      'अपॉइंटमेंट', 'बुक', 'मिलना',
      'பாயிண்ட்மெண்ட்', 'சந்திப்பு'
    ];

    const metalKeywords = ['gold', 'silver', 'platinum', '22k', '24k', '18k', '916', '91.6', 'carat', 'karat', 'gold rate', 'silver rate'];
    const isPriceInquiry = priceKeywords.some(kw => lowerMessage.includes(kw)) ||
                           (metalKeywords.some(kw => lowerMessage.includes(kw)) && 
                            (lowerMessage.includes('rate') || lowerMessage.includes('today') || lowerMessage.includes('how much') || lowerMessage.includes('price') || /^(?:22k|24k|916|91\.6)$/.test(lowerMessage.trim())));

    let intent = 'general_inquiry';
    if (complaintKeywords.some(kw => lowerMessage.includes(kw))) {
      intent = 'complaint';
    } else if (deliveryKeywords.some(kw => lowerMessage.includes(kw))) {
      intent = 'delivery_query';
    } else if (bookingKeywords.some(kw => lowerMessage.includes(kw))) {
      intent = 'consultation_booking';
    } else if (customKeywords.some(kw => lowerMessage.includes(kw))) {
      intent = 'customization';
    } else if (isPriceInquiry) {
      intent = 'price_inquiry';
    } else if (purchaseKeywords.some(kw => lowerMessage.includes(kw))) {
      intent = 'purchase_intent';
    }

    let sentiment = 'NEUTRAL';
    if (lowerMessage.includes('love') || lowerMessage.includes('great') || lowerMessage.includes('excellent') || lowerMessage.includes('visit') || lowerMessage.includes('want to')) {
      sentiment = 'POSITIVE';
    } else if (lowerMessage.includes('hate') || lowerMessage.includes('bad') || lowerMessage.includes('terrible') || lowerMessage.includes('disappointed')) {
      sentiment = 'NEGATIVE';
    }

    // Extract occasion
    let occasion = 'not_specified';
    if (lowerMessage.includes('bridal') || lowerMessage.includes('wedding')) {
      occasion = 'bridal';
    } else if (lowerMessage.includes('engagement')) {
      occasion = 'engagement';
    } else if (lowerMessage.includes('anniversary')) {
      occasion = 'anniversary';
    } else if (lowerMessage.includes('birthday')) {
      occasion = 'birthday';
    }

    // Extract explicit budget
    let explicitBudget = null;
    const budgetMatch = lowerMessage.match(/(?:budget|rs\.?|₹)\s*([\d,]+)/);
    if (budgetMatch && budgetMatch[1]) {
      explicitBudget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);
    }

    // Extract timeline
    let timeline = 'not_specified';
    if (lowerMessage.includes('today') || lowerMessage.includes('now') || lowerMessage.includes('immediately')) {
      timeline = 'today';
    } else if (lowerMessage.includes('this week') || lowerMessage.includes('6 weeks') || lowerMessage.includes('weeks')) {
      timeline = 'this_week';
    } else if (lowerMessage.includes('month')) {
      timeline = 'this_month';
    }

    // Direct client regex match for ad-hoc name updates
    const extractedName = this.extractExplicitName(message);

    return {
      intent,
      sentiment,
      urgency: 'medium',
      timeline,
      occasion,
      stageInJourney: 'awareness',
      explicitBudget,
      budgetRange: explicitBudget ? (explicitBudget > 100000 ? 'premium' : 'high') : 'not_mentioned',
      productInterest: null,
      followUpNeeded: true,
      keyPoints: [message.substring(0, 100)],
      language: this.detectLanguage(message),
      extractedName,
      detectedAt: new Date(),
      fallback: true
    };
  }

  extractExplicitName(message = '') {
    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) return null;

    const blockedWords = new Set([
      'gold', 'silver', 'platinum', 'diamond', 'ring', 'rings', 'bangle', 'bangles',
      'earring', 'earrings', 'necklace', 'necklaces', 'pendant', 'pendants',
      'bracelet', 'bracelets', 'chain', 'chains', 'catalog', 'catalogue', 'price',
      'rate', 'budget', 'offer', 'discount', 'order', 'payment', 'delivery'
    ]);

    const explicitPattern = /^(?:my name is|i am|i'm|this is|call me)\s+([a-zA-Z][a-zA-Z.'-]*(?:\s+[a-zA-Z][a-zA-Z.'-]*){0,2})\s*$/i;
    const herePattern = /^([a-zA-Z][a-zA-Z.'-]*(?:\s+[a-zA-Z][a-zA-Z.'-]*){0,2})\s+here\s*$/i;
    const match = text.match(explicitPattern) || text.match(herePattern);

    if (!match || !match[1]) return null;

    const parts = match[1]
      .trim()
      .split(/\s+/)
      .filter(part => !blockedWords.has(part.toLowerCase()));

    if (parts.length === 0) return null;

    const normalizeNamePart = part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    return {
      firstName: normalizeNamePart(parts[0]),
      lastName: parts.slice(1).map(normalizeNamePart).join(' ')
    };
  }

  async generateResponse(analysis, customerProfile = null, language = 'en', messageBody = '', mediaUrl = null) {
    try {
      // Define normalizedMessage at the very top so it's available in catch block
      const normalizedMessage = typeof messageBody === 'string' ? messageBody : '';
      
      const userId = customerProfile?.userId;
      const config = await this.getShopConfig(userId);

      // Check for Option 1/2 or Payment/Admin interceptions
      const interception = await this.checkInterceptions(messageBody, customerProfile, config, analysis, mediaUrl);
      if (interception) {
        return interception;
      }

      const isDefaultName = !customerProfile || customerProfile.firstName === 'Customer';
      const customerName = isDefaultName ? '' : customerProfile.firstName;
      const lowerMsg = normalizedMessage.toLowerCase().trim();

      const guideDirectResponse = this.getGuideDirectResponse(normalizedMessage, config, language);
      if (guideDirectResponse) {
        return {
          success: true,
          text: guideDirectResponse,
          language,
          generatedAt: new Date()
        };
      }

      if (mediaUrl && this.isReferenceImageMessage(normalizedMessage, analysis)) {
        return {
          success: true,
          text: this.localize('customization_reference', language),
          language,
          generatedAt: new Date()
        };
      }

      const selectedCategory = await this.detectCategorySelection(normalizedMessage, config?.websiteUrl);

      // Check for specific metal selection
      const selectedMetal = this.detectMetalSelection(normalizedMessage);
      if (selectedMetal && !selectedCategory) {
        return await this.handleMetalCatalogResponse(selectedMetal, userId, config, language);
      }

      // 1. Check if budget is mentioned WITHOUT category - acknowledge and ask for category
      const priceFilter = this.extractPriceFilter(normalizedMessage);
      const hasBudgetOnly = (priceFilter.minPrice !== null || priceFilter.maxPrice !== null) && 
                           !await this.detectCategorySelection(normalizedMessage, config?.websiteUrl);
      
      if (hasBudgetOnly) {
        let budgetMsg = '';
        if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
          budgetMsg = this.localize('budget_set_range', language, { minPrice: priceFilter.minPrice, maxPrice: priceFilter.maxPrice });
        } else if (priceFilter.maxPrice !== null) {
          budgetMsg = this.localize('budget_set', language, { maxPrice: priceFilter.maxPrice });
        } else if (priceFilter.minPrice !== null) {
          budgetMsg = this.localize('budget_set_above', language, { minPrice: priceFilter.minPrice });
        }
        
        if (budgetMsg) {
          // Save budget to customer profile for later category matching
          if (customerProfile) {
            const Customer = mongoose.model('Customer');
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': {
                menuLevel: 'AWAITING_CATEGORY',
                priceFilter: priceFilter
              }
            });
          }
          
          return {
            success: true,
            text: budgetMsg + '\n\n' + this.localize('catalog_prompt', language),
            mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
            language,
            generatedAt: new Date()
          };
        }
      }

      // 2. Check if category selection is matched in messageBody
      if (selectedCategory) {
        return await this.handleCategoryCatalogResponse(selectedCategory, userId, config, language, customerProfile, null, normalizedMessage);
      }

      // Check for "know more" request when user is looking at products
      const knowMoreKeywords = ['know more', 'more designs', 'show all', 'view all', 'see all', 'browse all', 'और देखें', 'மேலும் பார்க்க', 'మరిన్ని చూడండి', 'सभी देखे'];
      const isKnowMore = knowMoreKeywords.some(kw => lowerMsg.includes(kw));
      
      if (isKnowMore && customerProfile?.customFields?.catalogState?.subcategory) {
        // User is requesting full collection view
        const subcategory = customerProfile.customFields.catalogState.subcategory;
        const gender = customerProfile.customFields.catalogState.gender || 'WOMEN';
        const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
        const categoryPath = await this.getDynamicCategoryPath(gender, subcategory, config.websiteUrl);
        const categoryUrl = `${base}${categoryPath}`;
        
        return {
          success: true,
          text: this.localize('know_more_prompt', language, { 
            category: subcategory.toLowerCase(),
            categoryUrl 
          }),
          mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
          language,
          generatedAt: new Date()
        };
      }

      // Check for specific rate inquiry (22k, 24k, silver) to bypass Gemini for precise localized responses
      if (analysis.intent === 'price_inquiry') {
        let priceKey = null;
        if (lowerMsg === '22k' || lowerMsg.includes('22k') || lowerMsg.includes('22 karat') || lowerMsg.includes('22 carat') || lowerMsg.includes('22 kt') || lowerMsg.includes('22ct') || lowerMsg.includes('916') || lowerMsg.includes('91.6')) {
          priceKey = 'price_inquiry_22k';
        } else if (lowerMsg === '24k' || lowerMsg.includes('24k') || lowerMsg.includes('24 karat') || lowerMsg.includes('24 carat') || lowerMsg.includes('24 kt') || lowerMsg.includes('24ct')) {
          priceKey = 'price_inquiry_24k';
        } else if (lowerMsg === 'silver' || lowerMsg.includes('silver rate') || lowerMsg.includes('silver price') || lowerMsg.includes('வெள்ளி') || lowerMsg.includes('चांदी') || lowerMsg.includes('వెండి') || lowerMsg.includes('ಬೆಳ್ಳಿ')) {
          priceKey = 'price_inquiry_silver';
        }

        if (priceKey) {
          return {
            success: true,
            text: this.localize(priceKey, language, {
              customStartPrice: config.customStartPrice || 8500,
              gold22: config.goldRate22K,
              gold24: config.goldRate24K,
              silver: config.silverRate
            }),
            language,
            generatedAt: new Date()
          };
        }
      }

      // 2. Check if asking for catalog or collections generally
      const asksCatalogDirect = ['catalog', 'catalogue', 'menu', 'card', 'pdf', 'brochure', 'link'].some(kw => lowerMsg.includes(kw));
      const asksCollectionsGen = ['collection', 'collections', 'design', 'designs', 'piece', 'pieces', 'what do you have', 'items', 'variety', 'varieties', 'show me something', 'looking for jewelry', 'looking for jewellery', 'jewelry dikhao', 'jewellery dikhao', 'dikhao', 'i need help'].some(kw => lowerMsg.includes(kw));
      
      if (asksCatalogDirect || asksCollectionsGen) {
        return {
          success: true,
          text: this.localize('catalog_prompt', language),
          mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
          isCatalogPrompt: true,
          language,
          generatedAt: new Date()
        };
      }

      // Check for "I need more collections" or similar inquiry patterns
      const needsMoreCollections = ['need more', 'need collections', 'all collections', 'show all', 'tell me more', 'what else', 'more designs', 'more options', 'show more collections', 'complete collection', 'सभी संग्रह', 'सभी डिजाइन', 'और संग्रह', 'மேலும் சேகரண்', 'அனைத்து கிறது', 'అన్ని సంग్రహణలు', 'ಎಲ್ಲಾ ಸಂಗ್ರಹ'].some(kw => lowerMsg.includes(kw.toLowerCase()));
      
      if (needsMoreCollections) {
        const collectionsUrl = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
        return {
          success: true,
          text: this.localize('all_collections', language, { collectionsUrl }),
          mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
          isCollectionsPrompt: true,
          language,
          generatedAt: new Date()
        };
      }

      // Standard Gemini generation flow
      if (!process.env.GEMINI_API_KEY) {
        return await this.getFallbackResponse(analysis, customerProfile, language, normalizedMessage, mediaUrl);
      }

      const matchedCatalog = await this.getMatchingCatalogItems(userId, analysis.productInterest || '');
      let catalogContext = '';
      if (matchedCatalog && matchedCatalog.length > 0) {
        catalogContext = 'RELEVANT CATALOG ITEMS AVAILABLE IN STORE:\n' + matchedCatalog.map(item => 
          `- Name: *${item.name}*\n  Price: *₹${item.price}*\n  Description: ${item.description}\n  Image: ${item.imageUrl}`
        ).join('\n');
      }

      const prompt = `
You are a warm, polite AI jewelry consultant for "${config.shopName}". Respond to a customer inquiry.

SHOP KNOWLEDGE:
- Gold 22K Rate: ₹${config.goldRate22K}/gram
- Gold 24K Rate: ₹${config.goldRate24K}/gram
- Silver Rate: ₹${config.silverRate}/gram
- Platinum Rate: ₹${config.platinumRate}/gram
- Custom Jewelry Starting Price: ₹${config.customStartPrice || 8500}
- Address: ${config.address}
- Store Hours: ${config.operatingHours}
- Return Policy: ${config.returnPolicy}
- Custom Instructions: ${config.aiCustomInstructions}
- FAQs:
${config.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n')}

${catalogContext}

CUSTOMER CONTEXT:
- Customer Name: ${customerName || 'Not known yet'}
- Customer Language: ${language}
- Customer Intent: ${analysis.intent}
- Message Sentiment: ${analysis.sentiment}
- Message Body: "${normalizedMessage}"
- Customer shared media: ${mediaUrl ? 'yes' : 'no'}

CONVERSATIONAL RULES:
1. GREETING/NAME INQUIRY:
   - If the customer's name is NOT known yet (empty, generic, or "Customer"), welcome them warmly and ask for their name in ${language}.
   - If the customer's name IS known (e.g., "Priya"), greet them back in ${language}.
2. THANK YOU CLOSING: If the customer says "thank you" or similar, respond warmly in ${language}.
3. CATALOG / MENU CARD SHARING:
   - If they ask for the catalog or menu card directly (e.g., "send catalog", "show menu card"), offer options in ${language}.
   - If they select a category, present product details.
4. CURRENCY: Always represent pricing in Indian Rupees using "₹". NEVER use dollars ($) or "INR".
5. FORMATTING: Use WhatsApp markdown style (*text* to bold key details). Keep spacing clean.
6. LENGTH & TONE: Keep response under 240 characters. Sound like a helpful human jewelry consultant, never say you are an AI.

${this.getIntentInstructions(analysis.intent)}

Generate the response in ${language} now. You MUST generate the response completely in the customer's selected language: ${language} (which corresponds to: 'en' for English, 'hi' for Hindi, 'ta' for Tamil, 'te' for Telugu, 'mr' for Marathi, 'kn' for Kannada). Even if the customer messages you in English, you must respond to them in their selected language: ${language}. Translate any product details, prices, or greetings into ${language}. Do NOT reply in English if their language is not English.`;

      const result = await this.generateContentWithRetry(prompt);
      let responseText = result.response.text().trim();

      responseText = responseText
          .replace(/```[\s\S]*?```/g, '')
          .replace(/^["`*]+|["`*]+$/g, '')
          .trim();

      if (responseText.length > 240) {
        responseText = responseText.substring(0, 240).trim();
        const lastSpace = responseText.lastIndexOf(' ');
        if (lastSpace > 0) {
          responseText = responseText.substring(0, lastSpace);
        }
      }

      return {
        success: true,
        text: responseText,
        language,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Response Generation Error:', error.message);
      return await this.getFallbackResponse(analysis, customerProfile, language, normalizedMessage, mediaUrl);
    }
  }

  getIntentInstructions(intent) {
    const instructions = {
      price_inquiry: `
        Give specific price ranges for what they asked.
        Refer to Gold 22K/24K rates if they ask about gold rate per gram.
        CRITICAL: If the customer asks specifically for one metal or purity (e.g. only "22k" or only "24k" or only "silver"), you must ONLY state that specific rate in your reply. Do not show the whole rate card or custom starting prices unless they asked generally or for customization.
        If category is unclear, mention our customized design options.`,

      customization: `
        Get excited — this is high-value.
        Ask: budget, occasion, style preference.
        Mention our quality guarantee and free design consultation.`,

      complaint: `
        Start with genuine apology. Acknowledge the specific issue.
        Offer repair, replacement, or store credit options.`,

      purchase_intent: `
        Offer the customer two options to order:
        1. Order on Website: Invite them to visit our website to place their order directly.
        2. Order here in Chat: Ask them to send the design name/image, size, and address so we can place the order directly here in the chat.
        Always confirm pricing using the ₹ symbol.`,

      delivery_query: `
        Explain standard shipping timelines (2-4 days India-wide).
        Offer to share tracking details once order number is provided.`,

      consultation_booking: `
        Acknowledge their request and offer to schedule a call or store visit.
        Ask for their preferred date and time.`
    };

    return instructions[intent] || `
      Be helpful and warm.
      Guide them toward relevant products.
      Ask one clarifying question.`;
  }

  async getFallbackResponse(analysis, customerProfile = null, language = 'en', messageBody = '', mediaUrl = null) {
    const userId = customerProfile?.userId;
    const config = await this.getShopConfig(userId);
    const normalizedMessage = typeof messageBody === 'string' ? messageBody : '';

    // Check for Option 1/2 or Payment/Admin interceptions
    const interception = await this.checkInterceptions(normalizedMessage, customerProfile, config, analysis, mediaUrl);
    if (interception) {
      return interception;
    }

    if (mediaUrl && this.isReferenceImageMessage(normalizedMessage, analysis)) {
      return {
        success: true,
        text: this.localize('customization_reference', language),
        language,
        fallback: true,
        generatedAt: new Date()
      };
    }

    const isDefaultName = !customerProfile || customerProfile.firstName === 'Customer';
    const customerName = isDefaultName ? '' : customerProfile.firstName;
    const lowerMsg = normalizedMessage.toLowerCase().trim();

    const guideDirectResponse = this.getGuideDirectResponse(normalizedMessage, config, language);
    if (guideDirectResponse) {
      return {
        success: true,
        text: guideDirectResponse,
        language,
        fallback: true,
        generatedAt: new Date()
      };
    }

    // 1. Thank you closing rule
    const thankYouKeywords = ['thank', 'thanks', 'tq', 'dhanyawad', 'shukriya', 'thankyou'];
    if (thankYouKeywords.some(kw => lowerMsg.includes(kw))) {
      const namePart = customerName ? `, ${customerName}` : '';
      return {
        success: true,
        text: this.localize('thank_you', language, { namePart }),
        language,
        fallback: true,
        generatedAt: new Date()
      };
    }

    // 2. Greeting / Name Capture / Welcome back rule
    const isGreeting = ['hi', 'hii', 'hello', 'hey', 'namaste', 'vanakkam', 'namaskara', 'hola', 'yo', 'sup', 'wassup', 'good morning', 'good evening', 'gm', 'start', 'hello?', 'is anyone there?'].some(kw => lowerMsg.startsWith(kw) || lowerMsg === kw);
    const nameMatch = lowerMsg.match(/(?:my name is|i am|this is|call me)\s+([a-zA-Z]+)/i);

    if (isGreeting || lowerMsg === '') {
      if (isDefaultName) {
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1).toLowerCase();
          return {
            success: true,
            text: this.localize('nice_to_meet_you', language, { name }),
            language,
            fallback: true,
            generatedAt: new Date()
          };
        } else {
          return {
            success: true,
            text: this.localize('greeting_unknown', language),
            language,
            fallback: true,
            generatedAt: new Date()
          };
        }
      } else {
        return {
          success: true,
          text: this.localize('welcome_back', language, { name: customerName }),
          language,
          fallback: true,
          generatedAt: new Date()
        };
      }
    }

    // If a name is shared directly
    if (isDefaultName && this.isLikelyNameOnly(messageBody)) {
      const name = messageBody.trim().charAt(0).toUpperCase() + messageBody.trim().slice(1).toLowerCase();
      return {
        success: true,
        text: this.localize('nice_to_meet_you', language, { name }),
        language,
        fallback: true,
        generatedAt: new Date()
      };
    }

    // 3. Category selection check
    const selectedCategory = await this.detectCategorySelection(normalizedMessage, config?.websiteUrl);
    if (selectedCategory) {
      return await this.handleCategoryCatalogResponse(selectedCategory, userId, config, language, customerProfile, null, normalizedMessage);
    }

    // Check for specific metal selection after category checks so "gold earrings" routes to earrings.
    const selectedMetal = this.detectMetalSelection(normalizedMessage);
    if (selectedMetal) {
      return await this.handleMetalCatalogResponse(selectedMetal, userId, config, language);
    }

    // 4. Catalog / Menu Card Sharing Logic
    const asksCatalogDirect = ['catalog', 'catalogue', 'menu', 'card', 'pdf', 'brochure', 'link'].some(kw => lowerMsg.includes(kw));
    const asksCollectionsGen = ['collection', 'collections', 'design', 'designs', 'piece', 'pieces', 'what do you have', 'items', 'variety', 'varieties', 'show me something', 'looking for jewelry', 'looking for jewellery', 'jewelry dikhao', 'jewellery dikhao', 'dikhao', 'i need help'].some(kw => lowerMsg.includes(kw));
    const saysYes = ['yes', 'sure', 'please', 'ok', 'okay', 'yeah', 'yep', 'y'].includes(lowerMsg);

    if (asksCatalogDirect || asksCollectionsGen || saysYes) {
      return {
        success: true,
        text: this.localize('catalog_prompt', language),
        mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
        isCatalogPrompt: true,
        language,
        fallback: true,
        generatedAt: new Date()
      };
    }

    let priceKey = 'price_inquiry';
    if (analysis.intent === 'price_inquiry') {
      const lowerMsg = (messageBody || '').toLowerCase().trim();
      if (lowerMsg === '22k' || lowerMsg.includes('22k') || lowerMsg.includes('22 karat') || lowerMsg.includes('22 carat') || lowerMsg.includes('22 kt') || lowerMsg.includes('22ct') || lowerMsg.includes('916') || lowerMsg.includes('91.6')) {
        priceKey = 'price_inquiry_22k';
      } else if (lowerMsg === '24k' || lowerMsg.includes('24k') || lowerMsg.includes('24 karat') || lowerMsg.includes('24 carat') || lowerMsg.includes('24 kt') || lowerMsg.includes('24ct')) {
        priceKey = 'price_inquiry_24k';
      } else if (lowerMsg === 'silver' || lowerMsg.includes('silver rate') || lowerMsg.includes('silver price') || lowerMsg.includes('வெள்ளி') || lowerMsg.includes('चांदी') || lowerMsg.includes('వెండి') || lowerMsg.includes('ಬೆಳ್ಳಿ')) {
        priceKey = 'price_inquiry_silver';
      }
    }

    // Fallback based on categorized intent
    const intentResponses = {
      price_inquiry: this.localize(priceKey, language, { customStartPrice: config.customStartPrice || 8500, gold22: config.goldRate22K, gold24: config.goldRate24K, silver: config.silverRate }),
      customization: this.localize('customization', language),
      complaint: this.localize('complaint', language),
      purchase_intent: this.localize('purchase_intent', language),
      delivery_query: this.localize('delivery_query', language),
      customization_booking: this.localize('consultation_booking', language),
      general_inquiry: this.localize('general_inquiry', language)
    };

    return {
      success: true,
      text: intentResponses[analysis.intent] || intentResponses.general_inquiry,
      language,
      fallback: true,
      generatedAt: new Date()
    };
  }

  async getLastSelectedCategory(customerId) {
    try {
      const Message = mongoose.model('Message');
      const recentMessages = await Message.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      let skippedFirstCustomerMsg = false;
      for (const msg of recentMessages) {
        if (msg.content && !msg.aiGenerated) {
          if (!skippedFirstCustomerMsg) {
            skippedFirstCustomerMsg = true;
            continue;
          }
          const cat = await this.detectCategorySelection(msg.content);
          if (cat) return cat;
        }
      }
    } catch (e) {
      console.error('Error getting last selected category:', e.message);
    }
    return null;
  }

  detectMetalSelection(message) {
    const text = (message || '').toLowerCase().trim();
    // Exclude rate/price inquiries
    const hasRateKeyword = ['rate', 'price', 'today', 'how much', 'cost', '22k', '24k', 'value', 'per gram'].some(kw => text.includes(kw));
    if (hasRateKeyword) return null;

    if (text.includes('gold')) return 'GOLD';
    if (text.includes('silver')) return 'SILVER';
    if (text.includes('platinum')) return 'PLATINUM';
    return null;
  }

  isReferenceImageMessage(message = '', analysis = null) {
    const text = typeof message === 'string' ? message.toLowerCase().trim() : '';
    
    // ONLY return true for image-only messages with NO text
    if (!text) {
      return true;
    }

    // For messages with text, only treat as reference if they explicitly indicate design reference
    const strongReferenceKeywords = [
      'can you make', 'make this', 'like this design', 'similar to this',
      'exactly like this', 'copy this', 'replicate this',
      'design like this', 'make me something like this',
      'ye jaisa', 'is tarah', 'aisi hi', // Hindi
      'intha maari', 'idha maari', // Tamil
      'ee maari', 'idi maari', // Telugu
      'aiche', 'aich jaiche', // Marathi
    ];

    // Check if message contains strong reference keywords (more specific check)
    const isStrongReference = strongReferenceKeywords.some(keyword => text.includes(keyword));
    
    // Also check analysis intent - if explicitly customization with reference
    const isCustomizationWithRef = analysis?.intent === 'customization' && 
                                   (text.includes('design') || text.includes('custom') || text.includes('make'));

    return isStrongReference || isCustomizationWithRef;
  }

  async handleMetalCatalogResponse(metal, userId, config, language) {
    const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
    const searchUrl = `${base}?s=${metal.toLowerCase()}&post_type=product`;

    // Query local MongoDB database for items matching this metal
    let localItems = [];
    try {
      const CatalogItem = mongoose.model('CatalogItem');
      localItems = await CatalogItem.find({
        userId,
        $or: [
          { name: { $regex: metal, $options: 'i' } },
          { keywords: { $regex: metal, $options: 'i' } }
        ]
      }).limit(3).lean();
    } catch (err) {
      console.warn(`Failed to load metal ${metal} items:`, err.message);
    }

    const websiteImage = (localItems && localItems.length > 0 && localItems[0].imageUrl)
      ? localItems[0].imageUrl
      : (config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png');

    if (localItems && localItems.length > 0) {
      const textHeader = this.localize('metal_search_header', language, { metal: metal.toLowerCase() }) + '\n\n';
      const productsList = localItems.map((p, idx) => 
        `*${idx + 1}. ${p.name}*\n💰 ${language === 'hi' ? 'कीमत' : language === 'ta' ? 'விலை' : 'Price'}: ₹${p.price}\n🔗 ${language === 'hi' ? 'विवरण देखें' : language === 'ta' ? 'விவரம் பார்க்க' : 'View details'}: ${searchUrl}`
      ).join('\n\n');
      
      const textFooter = `\n\n${language === 'hi' ? 'हमारी वेबसाइट पर अधिक डिज़ाइन देखें' : language === 'ta' ? 'எங்கள் இணையதளத்தில் மேலும் வடிவமைப்புகளை ஆராயுங்கள்' : 'Explore more designs on our website'}:\n🔗 ${searchUrl}`;
      
      return {
        success: true,
        text: `${textHeader}${productsList}${textFooter}`,
        mediaUrl: websiteImage,
        scrapedProducts: localItems.map(item => ({
          name: item.name,
          price: `₹${item.price}`,
          imageUrl: item.imageUrl,
          productUrl: searchUrl
        })),
        selectedCategory: metal,
        language,
        generatedAt: new Date()
      };
    } else {
      const replyText = this.localize('metal_search_empty', language, { metal: metal.toLowerCase(), searchUrl });
      
      return {
        success: true,
        text: replyText,
        mediaUrl: websiteImage,
        scrapedProducts: [],
        language,
        generatedAt: new Date()
      };
    }
  }

  detectProductSelection(messageBody, lastScrapedProducts) {
    if (!lastScrapedProducts || lastScrapedProducts.length === 0) return null;
    const lowerMsg = (messageBody || '').toLowerCase().trim();

    // 1. Direct number/word match for 1, 2, 3
    const numRegex = /\b(1|one|first|2|two|second|3|three|third)\b/i;
    const match = lowerMsg.match(numRegex);
    if (match) {
      const val = match[1].toLowerCase();
      if (val === '1' || val === 'one' || val === 'first') return lastScrapedProducts[0];
      if (val === '2' || val === 'two' || val === 'second') return lastScrapedProducts[1] || null;
      if (val === '3' || val === 'three' || val === 'third') return lastScrapedProducts[2] || null;
    }

    // 2. Keyword/name matching
    for (const product of lastScrapedProducts) {
      if (!product || !product.name) continue;
      const productNameLower = product.name.toLowerCase();
      if (lowerMsg.includes(productNameLower)) {
        return product;
      }
      
      const productNameWords = productNameLower.split(/\s+/).filter(w => w.length > 2);
      let matchCount = 0;
      for (const word of productNameWords) {
        if (lowerMsg.includes(word)) {
          matchCount++;
        }
      }
      if (matchCount >= 2 || (productNameWords.length === 1 && lowerMsg.includes(productNameWords[0]))) {
        return product;
      }
    }

    return null;
  }

    isBackCommand(text) {
    const lower = (text || '').toLowerCase().trim();
    const backKeywords = [
      'back', 'go back', 'previous', 'prev', 'menu', 'home', 'main menu', 'start over',
      'पीछे', 'वापस', 'पिछला',
      'பின்னால்', 'முந்தைய',
      'వెనుకకు', 'మునుపటి',
      'मागे', 'पूर्वीचे',
      'ಹಿಂದಕ್ಕೆ', 'ಹಿಂದಿನ'
    ];
    return backKeywords.some(kw => lower === kw || lower.includes(kw));
  }

  detectTopMenuSelection(text) {
    const lower = (text || '').toLowerCase().trim();
    if (lower === '1' || lower.includes('women') || lower.includes('महिला') || lower.includes('பெண்') || lower.includes('మహిళ') || lower.includes('ಮಹಿಳೆ')) {
      return 'WOMEN';
    }
    if (lower === '2' || lower.includes('men') || lower.includes('पुरुष') || lower.includes('ஆண்') || lower.includes('పురుష') || lower.includes('ಪುರುಷ')) {
      return 'MEN';
    }
    if (lower === '3' || lower.includes('gift') || lower.includes('उपहार') || lower.includes('பரிசு') || lower.includes('గిఫ్ట్') || lower.includes('भेटवस्तू') || lower.includes('ಉಡುಗೊರೆ')) {
      return 'GIFTS';
    }
    return null;
  }

  isSimpleGreeting(text) {
    const lower = (text || '').toLowerCase().trim();
    if (!lower) return false;

    const greetingPatterns = [
      'hi', 'hii', 'hiii', 'hello', 'hey', 'hy',
      'good morning', 'good afternoon', 'good evening',
      'namaste', 'namaskar', 'gm', 'gn',
      'hola', 'start', 'yo', 'sup', 'wassup', 'hello?', 'is anyone there?'
    ];

    return greetingPatterns.some(greeting => lower === greeting);
  }

  isLikelyNameOnly(text) {
    const lower = (text || '').toLowerCase().trim();
    if (!/^[a-zA-Z\s]{2,30}$/.test(lower)) return false;

    const blockedWords = new Set([
      'yes', 'no', 'sure', 'fine', 'ok', 'okay', 'please', 'thanks', 'thank you',
      'ring', 'rings', 'bangle', 'bangles', 'earring', 'earrings', 'necklace', 'necklaces',
      'pendant', 'pendants', 'nose pin', 'nose pins', 'bracelet', 'bracelets', 'chain', 'chains',
      'gold', 'silver', 'platinum', 'diamond', 'catalog', 'catalogue', 'menu', 'design', 'designs',
      'gift', 'gifts', 'price', 'rate', 'budget', 'offer', 'discount', 'new in', 'best seller'
    ]);

    if (blockedWords.has(lower)) return false;
    return lower.split(/\s+/).every(part => /^[a-zA-Z]{2,15}$/.test(part));
  }

  getGuideDirectResponse(message, config = {}, language = 'en') {
    const lower = (message || '').toLowerCase().trim();
    if (!lower) return null;

    if (['who are you', 'are you a robot', 'what are you'].some(kw => lower.includes(kw))) {
      return this.localize('identity_response', language);
    }

    if (lower.includes('joke')) {
      return this.localize('joke_response', language);
    }

    if (lower.includes('ring size') || lower.includes('find my ring size') || lower.includes("don't know my size")) {
      return this.localize('size_guide_ring', language);
    }

    if (['where are you', 'located', 'location', 'address', 'shop', 'store', 'open today', 'opening time', 'store hours', 'visiting hours'].some(kw => lower.includes(kw))) {
      return this.localize('location_info', language, {
        address: config.address || 'Renic Jewellers',
        hours: config.operatingHours || 'Please contact us for current store hours'
      });
    }

    if (['return', 'exchange', 'warranty', 'buyback', 'take back', 'old gold', 'hallmark certificate'].some(kw => lower.includes(kw))) {
      return this.localize('policy_info', language, {
        policy: config.returnPolicy || 'We support warranty and exchange requests as per store policy.',
        phone: config.contactPhone || '+91 9345578103'
      });
    }

    if (['discount', 'offer', 'coupon', 'sale', 'scheme', 'festival offer', 'making charges'].some(kw => lower.includes(kw))) {
      return this.localize('offer_info', language, { phone: config.contactPhone || '+91 9345578103' });
    }

    if (['available', 'availability', 'in stock', 'stock', 'size available', 'pre-order', 'preorder'].some(kw => lower.includes(kw))) {
      return this.localize('stock_info', language);
    }

    if (['22k or 24k', '22k vs 24k', 'gold vs silver', 'which is better', 'genuine gold', 'real gold'].some(kw => lower.includes(kw))) {
      return this.localize('comparison_info', language);
    }

    if (['what is 2+2', '2+2', 'i am bored', "i'm bored"].some(kw => lower.includes(kw))) {
      return this.localize('random_redirect', language);
    }

    if (['bye', 'goodbye', 'see you', 'take care', 'will contact later', "that's all", 'thats all'].some(kw => lower === kw || lower.includes(kw))) {
      return this.localize('closing_response', language);
    }

    if (['gpay', 'phonepe', 'upi', 'bhim', 'do you accept card', 'card payment', 'credit card', 'debit card', 'how to pay', 'payment secure', 'secure payment'].some(kw => lower.includes(kw))) {
      return this.localize('payment_options_info', language);
    }

    if (['cod', 'cash on delivery'].some(kw => lower.includes(kw))) {
      return this.localize('cod_info', language, { phone: config.contactPhone || '+91 9345578103' });
    }

    if (['payment number', 'bank transfer', 'neft', 'emi', 'installment', 'installments'].some(kw => lower.includes(kw))) {
      return this.localize('payment_admin_info', language, { phone: config.contactPhone || '+91 9345578103' });
    }

    if (['gift wrapping', 'gift wrap', 'personalised note', 'personalized note', 'send with a note', 'gift card', 'voucher'].some(kw => lower.includes(kw))) {
      return this.localize('gift_service_info', language, { phone: config.contactPhone || '+91 9345578103' });
    }

    const hasVagueBudget = ['affordable', 'cheap', 'not too expensive', 'low budget'].some(kw => lower.includes(kw));
    const hasPremiumBudget = ['premium', 'luxury', 'high end', 'heavy'].some(kw => lower.includes(kw));
    if (hasVagueBudget || hasPremiumBudget) {
      return this.localize('vague_budget_prompt', language);
    }

    if (['i want to buy a gift', 'something special'].some(kw => lower.includes(kw))) {
      return this.localize('gift_help_prompt', language);
    }

    return null;
  }

  extractCustomizationDetails(message, analysis = null) {
    const text = (message || '').trim();
    const lower = text.toLowerCase();
    const priceFilter = this.extractPriceFilter(text);

    let occasion = null;
    if (analysis?.occasion && analysis.occasion !== 'not_specified') {
      occasion = analysis.occasion.replace(/_/g, ' ');
    } else if (/(daily wear|office wear|regular wear|everyday)/i.test(lower)) {
      occasion = 'daily wear';
    } else if (/(wedding|bridal)/i.test(lower)) {
      occasion = 'wedding';
    } else if (/anniversary/i.test(lower)) {
      occasion = 'anniversary';
    } else if (/engagement/i.test(lower)) {
      occasion = 'engagement';
    } else if (/birthday/i.test(lower)) {
      occasion = 'birthday';
    } else if (/gift/i.test(lower)) {
      occasion = 'gift';
    }

    let color = null;
    const colorPatterns = [
      { regex: /(rose gold|pink gold)/i, value: 'rose gold' },
      { regex: /(white gold)/i, value: 'white gold' },
      { regex: /(yellow gold|gold colour|gold color|golden)/i, value: 'yellow gold' },
      { regex: /(silver colour|silver color|silver finish)/i, value: 'silver finish' },
      { regex: /(matte|matt)/i, value: 'matte finish' },
      { regex: /(glossy|high polish|polish)/i, value: 'high polish finish' }
    ];
    for (const pattern of colorPatterns) {
      if (pattern.regex.test(lower)) {
        color = pattern.value;
        break;
      }
    }

    let size = null;
    const sizeMatch =
      text.match(/(?:size|bangle size|ring size|bracelet size|wrist size)\s*[:\-]?\s*([a-z0-9./ -]{1,15})/i) ||
      text.match(/\b(\d{1,2}(?:\.\d{1,2})?)\s*(?:cm|mm|inch|inches)\b/i) ||
      text.match(/\b(2\.\d{1,2}|[1-4]-[0-9]{1,2}|[1-4])\b/i);
    if (sizeMatch && sizeMatch[1]) {
      size = sizeMatch[1].trim();
    } else if (/\b(small|medium|large|xl)\b/i.test(lower)) {
      size = lower.match(/\b(small|medium|large|xl)\b/i)[1].toLowerCase();
    }

    let budget = null;
    if (analysis?.explicitBudget) {
      budget = analysis.explicitBudget;
    } else if (priceFilter.minPrice !== null || priceFilter.maxPrice !== null) {
      if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
        budget = `${priceFilter.minPrice}-${priceFilter.maxPrice}`;
      } else {
        budget = priceFilter.maxPrice ?? priceFilter.minPrice;
      }
    }

    return { occasion, color, size, budget };
  }

  mergeCustomizationState(existingState = {}, incoming = {}) {
    const referenceImageUrls = [
      ...(Array.isArray(existingState.referenceImageUrls) ? existingState.referenceImageUrls : []),
      ...(existingState.referenceImageUrl ? [existingState.referenceImageUrl] : []),
      ...(incoming.referenceImageUrl ? [incoming.referenceImageUrl] : [])
    ].filter((url, index, urls) => url && urls.indexOf(url) === index);

    return {
      active: true,
      referenceReceived: existingState.referenceReceived || incoming.referenceReceived || false,
      referenceImageUrl: incoming.referenceImageUrl || existingState.referenceImageUrl || null,
      referenceImageUrls,
      details: {
        occasion: incoming.occasion || existingState.details?.occasion || null,
        color: incoming.color || existingState.details?.color || null,
        size: incoming.size || existingState.details?.size || null,
        budget: incoming.budget || existingState.details?.budget || null
      },
      startedAt: existingState.startedAt || new Date(),
      lastUpdatedAt: new Date()
    };
  }

  getMissingCustomizationFields(state) {
    const details = state?.details || {};
    const missing = [];
    if (!details.occasion) missing.push('occasion');
    if (!details.color) missing.push('color');
    if (!details.size) missing.push('size');
    if (!details.budget) missing.push('budget');
    return missing;
  }

  buildCustomizationPrompt(state, language = 'en') {
    const details = state?.details || {};
    const missing = this.getMissingCustomizationFields(state);
    const referenceCount = Array.isArray(state?.referenceImageUrls) ? state.referenceImageUrls.length : (state?.referenceReceived ? 1 : 0);
    const referenceLine = state?.referenceReceived
      ? `We have received your design image reference${referenceCount > 1 ? 's' : ''}.`
      : '';

    if (missing.length === 0) {
      const budgetText = typeof details.budget === 'number'
        ? `₹${details.budget.toLocaleString('en-IN')}`
        : details.budget;
      return `${referenceLine ? `${referenceLine}\n\n` : ''}Perfect! We’ve noted your custom request:

1. Occasion: ${details.occasion}
2. Preferred colour/finish: ${details.color}
3. Size: ${details.size}
4. Budget: ${budgetText}

Our jewelry consultant will review the design reference and contact you shortly with design options.`;
    }

    const prompts = {
      occasion: 'the occasion or usage (daily wear, wedding, gift, etc.)',
      color: 'your preferred colour or finish (yellow gold, rose gold, white gold, matte, polish, etc.)',
      size: 'the required size (for example ring size, bangle size, wrist size, or measurements)',
      budget: 'your estimated budget range'
    };

    const remainingText = missing.map((field, index) => `${index + 1}. ${prompts[field]}`).join('\n');

    if (state?.referenceReceived && missing.length === 4) {
      return `Thank you for sharing the design image${referenceCount > 1 ? 's' : ''}. We have accepted ${referenceCount > 1 ? 'them' : 'it'} as your reference design${referenceCount > 1 ? 's' : ''}. Please reply with:

${remainingText}

Once we have these details, we can prepare the customization consultation properly.`;
    }

    return `${referenceLine ? `${referenceLine}\n\n` : ''}Noted. To continue your customization request, please share:

${remainingText}`;
  }

  detectSubCategorySelection(text, gender) {
    const lower = (text || '').toLowerCase().trim();
    const genUpper = (gender || '').toUpperCase();
    
    if (genUpper === 'WOMEN') {
      if (lower === '1' || lower.includes('bangle') || lower.includes('चूड़ी') || lower.includes('வளையல்') || lower.includes('గాజు') || lower.includes('बांगड्या') || lower.includes('ಬಳೆ')) return 'BANGLE';
      if (lower === '2' || lower.includes('earring') || lower.includes('झुमके') || lower.includes('கம்மல்') || lower.includes('చెవి') || lower.includes('ओಲೆ')) return 'EARRINGS';
      if (lower === '3' || lower.includes('ring') || lower.includes('अंगूठी') || lower.includes('மோதிர') || lower.includes('ఉంగర') || lower.includes('अंगठ्या') || lower.includes('ಉಂಗುರ')) return 'RINGS';
      if (lower === '4' || lower.includes('necklace') || lower.includes('हार') || lower.includes('நெக்லஸ்') || lower.includes('నెక్లెస్') || lower.includes('ಹಾರ')) return 'NECKLACE';
      if (lower === '5' || lower.includes('pendant') || lower.includes('पेंडेंट') || lower.includes('பதக்கம்') || lower.includes('లాకెట్') || lower.includes('ಪೆಂಡೆಂಟ್')) return 'PENDANT';
      if (lower === '6' || lower.includes('nose') || lower.includes('नाक') || lower.includes('மூக்கு') || lower.includes('ముక్కు') || lower.includes('ನತ್') || lower.includes('ಮೂಗು')) return 'NOSE_PINS';
    } else if (genUpper === 'MEN') {
      if (lower === '1' || lower.includes('bracelet') || lower.includes('कंगन') || lower.includes('காப்பு') || lower.includes('బ్రాస్లెట్') || lower.includes('कडे') || lower.includes('ಕೈಕಡ')) return 'BRACELET';
      if (lower === '2' || lower.includes('chain') || lower.includes('चेन') || lower.includes('செயின்') || lower.includes('చైన్') || lower.includes('ಸರ')) return 'CHAINS';
      if (lower === '3' || lower.includes('ring') || lower.includes('अंगूठी') || lower.includes('மோதிர') || lower.includes('ఉంగర') || lower.includes('अंगठ्या') || lower.includes('ಉಂಗುರ')) return 'RINGS';
    }
    return null;
  }

  async checkInterceptions(messageBody, customerProfile, config, analysis = null, mediaUrl = null) {
    if (!customerProfile) return null;

    const lowerMsg = (messageBody || '').toLowerCase().trim();
    const languageSelected = customerProfile.customFields?.languageSelected;
    const awaitingLanguage = customerProfile.customFields?.awaitingLanguageSelection;

    const languageMenu = `Welcome to Renic Jewellers! Please select your preferred language to continue:
नमस्ते! कृपया आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें:

1. English 🇬🇧
2. Hindi (हिंदी) 🇮🇳
3. Tamil (தமிழ்) 🇮🇳
4. Telugu (తెలుగు) 🇮🇳
5. Marathi (मराठी) 🇮🇳
6. Kannada (ಕನ್ನಡ) 🇮🇳

Please reply with the number (1-6) of your choice! / कृपया अपनी पसंद की संख्या (1-6) के साथ उत्तर दें!`;

    // Dynamic Language Switching Check
    const changeLangKeywords = [
      'change language', 'switch language', 'select language', 'language', 'change lang',
      'भाषा बदलें', 'भाषा', 'बोली',
      'மொழி மாற்று', 'மொழி',
      'భాష మార్చండి', 'భాష',
      'ಭಾಷೆ ಬದಲಾಯಿಸಿ', 'ಭಾಷೆ'
    ];
    const isChangeLangRequest = changeLangKeywords.some(kw => lowerMsg === kw || lowerMsg.includes(kw)) &&
                                !['1', '2', '3', '4', '5', '6'].includes(lowerMsg);

    if (isChangeLangRequest) {
      const Customer = mongoose.model('Customer');
      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.languageSelected': false,
        'customFields.awaitingLanguageSelection': true
      });
      return {
        success: true,
        text: languageMenu,
        generatedAt: new Date()
      };
    }

    // Language Onboarding on First Message
    if (!languageSelected) {
      const Customer = mongoose.model('Customer');
      const detectedLang = customerProfile.language || this.detectLanguage(messageBody);
      const isGreeting = this.isSimpleGreeting(messageBody);
      let priorCustomerMessages = 0;

      try {
        const Message = mongoose.model('Message');
        priorCustomerMessages = await Message.countDocuments({
          customerId: customerProfile._id,
          aiGenerated: { $ne: true },
          tags: 'incoming'
        });
      } catch (error) {
        console.warn('Language onboarding history check failed:', error.message);
      }

      const shouldBypassLanguagePrompt = !awaitingLanguage && (priorCustomerMessages > 1 || mediaUrl);

      if (shouldBypassLanguagePrompt) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          language: detectedLang,
          'customFields.languageSelected': true,
          'customFields.awaitingLanguageSelection': false
        });
        customerProfile.language = detectedLang;
        customerProfile.customFields = {
          ...(customerProfile.customFields || {}),
          languageSelected: true,
          awaitingLanguageSelection: false
        };
      } else if (isGreeting) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          language: detectedLang,
          'customFields.languageSelected': true,
          'customFields.awaitingLanguageSelection': false
        });

        return {
          success: true,
          text: this.localize('general_inquiry', detectedLang),
          language: detectedLang,
          generatedAt: new Date()
        };
      }

      if (!awaitingLanguage && !shouldBypassLanguagePrompt) {
        // First message - prompt for language
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.awaitingLanguageSelection': true
        });
        return {
          success: true,
          text: languageMenu,
          generatedAt: new Date()
        };
      } else if (awaitingLanguage) {
        // Awaiting language input - match the number
        let selectedLang = null;
        let welcomeMsg = '';
        
        if (lowerMsg === '1' || lowerMsg.includes('english')) {
          selectedLang = 'en';
          welcomeMsg = `Nice to meet you! Welcome to Renic Jewellers. How can we help you today?`;
        } else if (lowerMsg === '2' || lowerMsg.includes('hindi') || lowerMsg.includes('हिंदी')) {
          selectedLang = 'hi';
          welcomeMsg = `नमस्ते! रेनिक ज्वेलर्स में आपका स्वागत है। आज हम आपकी क्या सहायता कर सकते हैं?`;
        } else if (lowerMsg === '3' || lowerMsg.includes('tamil') || lowerMsg.includes('தமிழ்')) {
          selectedLang = 'ta';
          welcomeMsg = `வணக்கம்! ரெனிக் ஜூவல்லரிக்கு உங்களை வரவேற்கிறோம். இன்று உங்களுக்கு எவ்வாறு உதவலாம்?`;
        } else if (lowerMsg === '4' || lowerMsg.includes('telugu') || lowerMsg.includes('తెలుగు')) {
          selectedLang = 'te';
          welcomeMsg = `నమస్కారం! రేనిక్ జ్యువెలర్స్‌కు స్వాగతం. ఈరోజు మేము మీకు ఎలా సహాయపడగలము?`;
        } else if (lowerMsg === '5' || lowerMsg.includes('marathi') || lowerMsg.includes('मराठी')) {
          selectedLang = 'mr';
          welcomeMsg = `नमस्कार! रेनिक ज्वेलर्समध्ये आपले स्वागत आहे. आज आम्ही आपली काय मदत करू शकतो?`;
        } else if (lowerMsg === '6' || lowerMsg.includes('kannada') || lowerMsg.includes('ಕನ್ನಡ')) {
          selectedLang = 'kn';
          welcomeMsg = `ನಮಸ್ಕಾರ! ರೆನಿಕ್ ಜ್ಯುವೆಲ್ಲರ್ಸ್ ಗೆ ಸ್ವಾಗತ. ಇಂದು ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`;
        }

        if (selectedLang) {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            language: selectedLang,
            'customFields.languageSelected': true,
            'customFields.awaitingLanguageSelection': false
          });

          return {
            success: true,
            text: welcomeMsg,
            generatedAt: new Date()
          };
        } else {
          return {
            success: true,
            text: `Invalid selection. / अमान्य विकल्प।\n\n${languageMenu}`,
            generatedAt: new Date()
          };
        }
      }
    }

    const Customer = mongoose.model('Customer');
    const lang = customerProfile.language || 'en';
    const customizationState = customerProfile.customFields?.customizationState || null;

    if (mediaUrl && this.isReferenceImageMessage(messageBody, analysis)) {
      const initialDetails = this.extractCustomizationDetails(messageBody, analysis);
      const newCustomizationState = this.mergeCustomizationState(customizationState, {
        ...initialDetails,
        referenceReceived: true,
        referenceImageUrl: mediaUrl
      });

      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.customizationState': newCustomizationState
      });
      customerProfile.customFields = {
        ...(customerProfile.customFields || {}),
        customizationState: newCustomizationState
      };

      return {
        success: true,
        text: this.buildCustomizationPrompt(newCustomizationState, lang),
        language: lang,
        generatedAt: new Date()
      };
    }

    if (customizationState?.active) {
      const incomingDetails = this.extractCustomizationDetails(messageBody, analysis);
      const hasUsefulCustomizationInput = Boolean(
        incomingDetails.occasion ||
        incomingDetails.color ||
        incomingDetails.size ||
        incomingDetails.budget
      );

      if (hasUsefulCustomizationInput) {
        const updatedCustomizationState = this.mergeCustomizationState(customizationState, incomingDetails);
        const missingFields = this.getMissingCustomizationFields(updatedCustomizationState);

        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.customizationState': {
            ...updatedCustomizationState,
            active: missingFields.length > 0
          }
        });
        customerProfile.customFields = {
          ...(customerProfile.customFields || {}),
          customizationState: {
            ...updatedCustomizationState,
            active: missingFields.length > 0
          }
        };

        return {
          success: true,
          text: this.buildCustomizationPrompt(updatedCustomizationState, lang),
          language: lang,
          generatedAt: new Date()
        };
      }

      return {
        success: true,
        text: this.buildCustomizationPrompt(customizationState, lang),
        language: lang,
        generatedAt: new Date()
      };
    }

    let catalogState = customerProfile.customFields?.catalogState || null;



    // Parse active price filter
    const priceFilter = this.extractPriceFilter(messageBody);
    const hasPriceFilter = priceFilter.minPrice !== null || priceFilter.maxPrice !== null;

    // 1. Quick Reply Matching
    const QuickReply = mongoose.model('QuickReply');
    const activeQuickReplies = await QuickReply.find({ userId: customerProfile.userId, isActive: true }).lean();
    let matchedQuickReply = null;
    
    for (const qr of activeQuickReplies) {
      if (qr.shortcut) {
        const shortcutClean = qr.shortcut.replace(/^\//, '').toLowerCase().trim();
        if (lowerMsg === shortcutClean || lowerMsg === '/' + shortcutClean) {
          matchedQuickReply = qr;
          break;
        }
      }
      if (qr.title) {
        const titleClean = qr.title.toLowerCase().trim();
        if (lowerMsg === titleClean) {
          matchedQuickReply = qr;
          break;
        }
      }
    }
    
    // Fallback keyword match for quick reply
    if (!matchedQuickReply) {
      for (const qr of activeQuickReplies) {
        if (qr.shortcut) {
          const shortcutClean = qr.shortcut.replace(/^\//, '').toLowerCase().trim();
          if (lowerMsg.includes(shortcutClean) && shortcutClean.length > 3) {
            matchedQuickReply = qr;
            break;
          }
        }
      }
    }

    if (matchedQuickReply) {
      // Async update usage stats
      QuickReply.findByIdAndUpdate(matchedQuickReply._id, {
        \u0024inc: { usageCount: 1 },
        lastUsedAt: new Date()
      }).catch(err => console.error('Failed to update quick reply stats:', err.message));

      const aiSmartFeatures = require('./aiSmartFeatures');
      const personalizedText = await aiSmartFeatures.personalizeMessage(matchedQuickReply.content, customerProfile);
      
      // Exit catalog flow to prevent blocking after quick reply
      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.catalogState': null
      });
      if (customerProfile.customFields) {
        customerProfile.customFields.catalogState = null;
      }

      return {
        success: true,
        text: personalizedText,
        language: lang,
        generatedAt: new Date()
      };
    }

    const earlyGuideResponse = this.getGuideDirectResponse(messageBody, config, lang);
    const isExplicitGuideQuestion = (
      lowerMsg.includes('ring size') ||
      lowerMsg.includes('find my ring size') ||
      lowerMsg.includes("don't know my size") ||
      ['who are you', 'are you a robot', 'what are you'].some(kw => lowerMsg.includes(kw)) ||
      lowerMsg.includes('joke') ||
      ['where are you', 'located', 'location', 'address', 'open today', 'opening time', 'store hours', 'visiting hours'].some(kw => lowerMsg.includes(kw)) ||
      ['22k or 24k', '22k vs 24k', 'gold vs silver', 'which is better', 'genuine gold', 'real gold'].some(kw => lowerMsg.includes(kw))
    );
    if (earlyGuideResponse && isExplicitGuideQuestion) {
      return {
        success: true,
        text: earlyGuideResponse,
        language: lang,
        generatedAt: new Date()
      };
    }

    // 2. Direct Category Selection Check (bypasses intent-based template routing)
    const isDigit = /^\d+$/.test(lowerMsg);
    const hasActiveCatalog = !!(catalogState && catalogState.menuLevel);

    if (!hasActiveCatalog || !isDigit) {
      const selectedCategory = await this.detectCategorySelection(messageBody, config?.websiteUrl);
      if (selectedCategory) {
        return await this.handleCategoryCatalogResponse(selectedCategory, customerProfile.userId, config, lang, customerProfile, null, messageBody);
      }
    }

    // 3. Intercept catalog entry triggers
    const asksCatalogDirect = ['catalog', 'catalogue', 'menu', 'card', 'pdf', 'brochure', 'link'].some(kw => lowerMsg.includes(kw));
    const asksCollectionsGen = ['collection', 'collections', 'design', 'designs', 'piece', 'pieces', 'what do you have', 'items', 'variety', 'varieties', 'show me something', 'looking for jewelry', 'looking for jewellery', 'jewelry dikhao', 'jewellery dikhao', 'dikhao', 'i need help'].some(kw => lowerMsg.includes(kw));

    if (asksCatalogDirect || asksCollectionsGen) {
      const newState = { 
        menuLevel: 'TOP',
        priceFilter: hasPriceFilter ? priceFilter : null
      };
      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.catalogState': newState
      });
      if (customerProfile.customFields) {
        customerProfile.customFields.catalogState = newState;
      } else {
        customerProfile.customFields = { catalogState: newState };
      }

      return {
        success: true,
        text: this.localize('catalog_prompt', lang),
        mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
        language: lang,
        generatedAt: new Date()
      };
    }

    // 4. State Machine Catalog Flow
    if (catalogState && catalogState.menuLevel) {
      const menuLevel = catalogState.menuLevel;
      const activeFilter = hasPriceFilter ? priceFilter : catalogState.priceFilter;

      // Check for "back" navigation
      if (this.isBackCommand(messageBody)) {
        let nextLevel = 'TOP';
        let nextGender = catalogState.gender;
        let nextSub = catalogState.subcategory;
        let responseText = '';
        let responseMediaUrl = config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png';
        let responseScrapedProducts = null;
        let responseSelectedCategory = null;

        if (menuLevel === 'PRODUCT_DETAIL') {
          nextLevel = 'PRODUCTS';
          responseText = '';
          responseScrapedProducts = catalogState.products || [];
          responseSelectedCategory = catalogState.subcategory;
        } else if (menuLevel === 'PRODUCTS') {
          if (catalogState.gender === 'GIFTS') {
            nextLevel = 'TOP';
            responseText = this.localize('catalog_prompt', lang);
          } else {
            nextLevel = 'SUB_CATEGORY';
            responseText = this.localize(catalogState.gender === 'WOMEN' ? 'womens_submenu' : 'mens_submenu', lang);
          }
        } else if (menuLevel === 'SUB_CATEGORY' || menuLevel === 'RINGS_GENDER_SELECT') {
          nextLevel = 'TOP';
          responseText = this.localize('catalog_prompt', lang);
        } else {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return null;
        }

        const updatedState = {
          menuLevel: nextLevel,
          gender: nextGender,
          subcategory: nextSub,
          products: catalogState.products,
          priceFilter: activeFilter
        };

        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.catalogState': updatedState
        });
        if (customerProfile.customFields) {
          customerProfile.customFields.catalogState = updatedState;
        }

        return {
          success: true,
          text: responseText,
          mediaUrl: responseMediaUrl,
          scrapedProducts: responseScrapedProducts,
          selectedCategory: responseSelectedCategory,
          language: lang,
          generatedAt: new Date()
        };
      }

      // Forward Navigation
      if (menuLevel === 'TOP') {
        let selectedGender = this.detectTopMenuSelection(messageBody);
        if (!selectedGender) {
          if (['wife', 'girlfriend', 'mom', 'mother', 'sister', 'daughter'].some(kw => lowerMsg.includes(kw))) {
            selectedGender = 'WOMEN';
          } else if (['husband', 'boyfriend', 'dad', 'father', 'brother', 'son'].some(kw => lowerMsg.includes(kw))) {
            selectedGender = 'MEN';
          }
        }
        if (selectedGender) {
          if (selectedGender === 'GIFTS') {
            const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', 'GIFTS', 'GIFTS');
            const filtered = activeFilter ? this.applyPriceFilter(rawProducts, activeFilter) : rawProducts.slice(0, 3);
            
            const updatedState = {
              menuLevel: 'PRODUCTS',
              gender: 'GIFTS',
              subcategory: 'GIFTS',
              products: filtered,
              priceFilter: activeFilter
            };

            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            return {
              success: true,
              text: '',
              scrapedProducts: filtered,
              selectedCategory: 'Gifts',
              language: lang,
              generatedAt: new Date()
            };
          } else {
            const updatedState = {
              menuLevel: 'SUB_CATEGORY',
              gender: selectedGender,
              priceFilter: activeFilter
            };
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            const submenuKey = selectedGender === 'WOMEN' ? 'womens_submenu' : 'mens_submenu';
            return {
              success: true,
              text: this.localize(submenuKey, lang),
              language: lang,
              generatedAt: new Date()
            };
          }
        } else {
          if (hasPriceFilter) {
            const updatedState = {
              menuLevel: 'TOP',
              priceFilter: priceFilter
            };
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            let budgetSetText = '';
            if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
              budgetSetText = this.localize('budget_set_range', lang, { minPrice: priceFilter.minPrice, maxPrice: priceFilter.maxPrice });
            } else if (priceFilter.maxPrice !== null) {
              budgetSetText = this.localize('budget_set', lang, { maxPrice: priceFilter.maxPrice });
            } else if (priceFilter.minPrice !== null) {
              budgetSetText = this.localize('budget_set_above', lang, { minPrice: priceFilter.minPrice });
            }

            return {
              success: true,
              text: `${budgetSetText}\n\n${this.localize('catalog_prompt', lang)}`,
              mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
              language: lang,
              generatedAt: new Date()
            };
          }

          if (/^\d+$/.test(lowerMsg)) {
            return {
              success: true,
              text: `Invalid selection. Please choose 1, 2, or 3.\n\n${this.localize('catalog_prompt', lang)}`,
              mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
              language: lang,
              generatedAt: new Date()
            };
          } else {
            // Unrelated response - exit flow
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': null
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = null;
            }
            return null;
          }
        }
      }

      if (menuLevel === 'RINGS_GENDER_SELECT') {
        let selectedGender = this.detectGenderFromMessage(messageBody);
        if (!selectedGender) {
          if (lowerMsg === '1') selectedGender = 'WOMEN';
          else if (lowerMsg === '2') selectedGender = 'MEN';
          else if (lowerMsg === '3') selectedGender = 'GIFTS';
        }

        if (selectedGender) {
          if (selectedGender === 'GIFTS') {
            return await this.handleCategoryCatalogResponse('GIFTS', customerProfile.userId, config, lang, customerProfile, 'GIFTS', messageBody);
          }
          return await this.handleCategoryCatalogResponse('RINGS', customerProfile.userId, config, lang, customerProfile, selectedGender, messageBody);
        } else {
          if (hasPriceFilter) {
            const updatedState = {
              menuLevel: 'RINGS_GENDER_SELECT',
              priceFilter: priceFilter
            };
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            let budgetSetText = '';
            if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
              budgetSetText = this.localize('budget_set_range', lang, { minPrice: priceFilter.minPrice, maxPrice: priceFilter.maxPrice });
            } else if (priceFilter.maxPrice !== null) {
              budgetSetText = this.localize('budget_set', lang, { maxPrice: priceFilter.maxPrice });
            } else if (priceFilter.minPrice !== null) {
              budgetSetText = this.localize('budget_set_above', lang, { minPrice: priceFilter.minPrice });
            }

            return {
              success: true,
              text: `${budgetSetText}\n\n${this.localize('rings_gender_prompt', lang)}`,
              language: lang,
              generatedAt: new Date()
            };
          }

          if (/^\d+$/.test(lowerMsg)) {
            return {
              success: true,
              text: `Invalid selection. Please choose 1 for Women, 2 for Men, or 3 for Gifts.\n\n${this.localize('rings_gender_prompt', lang)}`,
              language: lang,
              generatedAt: new Date()
            };
          } else {
            // Unrelated response - exit flow
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': null
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = null;
            }
            return null;
          }
        }
      }

      if (menuLevel === 'SUB_CATEGORY') {
        const sub = this.detectSubCategorySelection(messageBody, catalogState.gender);
        if (sub) {
          const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', catalogState.gender, sub);
          const filtered = activeFilter ? this.applyPriceFilter(rawProducts, activeFilter) : rawProducts.slice(0, 3);
          
          const updatedState = {
            menuLevel: 'PRODUCTS',
            gender: catalogState.gender,
            subcategory: sub,
            products: filtered,
            priceFilter: activeFilter
          };

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': updatedState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = updatedState;
          }

          return {
            success: true,
            text: '',
            scrapedProducts: filtered,
            selectedCategory: sub,
            language: lang,
            generatedAt: new Date()
          };
        } else {
          if (hasPriceFilter) {
            const updatedState = {
              menuLevel: 'SUB_CATEGORY',
              gender: catalogState.gender,
              priceFilter: priceFilter
            };
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            let budgetSetText = '';
            if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
              budgetSetText = this.localize('budget_set_range', lang, { minPrice: priceFilter.minPrice, maxPrice: priceFilter.maxPrice });
            } else if (priceFilter.maxPrice !== null) {
              budgetSetText = this.localize('budget_set', lang, { maxPrice: priceFilter.maxPrice });
            } else if (priceFilter.minPrice !== null) {
              budgetSetText = this.localize('budget_set_above', lang, { minPrice: priceFilter.minPrice });
            }

            const submenuKey = catalogState.gender === 'WOMEN' ? 'womens_submenu' : 'mens_submenu';
            return {
              success: true,
              text: `${budgetSetText}\n\n${this.localize(submenuKey, lang)}`,
              language: lang,
              generatedAt: new Date()
            };
          }

          if (/^\d+$/.test(lowerMsg)) {
            const submenuKey = catalogState.gender === 'WOMEN' ? 'womens_submenu' : 'mens_submenu';
            return {
              success: true,
              text: `Invalid choice. Please select from the menu.\n\n${this.localize(submenuKey, lang)}`,
              language: lang,
              generatedAt: new Date()
            };
          } else {
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': null
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = null;
            }
            return null;
          }
        }
      }

      if (menuLevel === 'PRODUCTS') {
        // If a price filter is sent while looking at products, re-filter the products list
        if (hasPriceFilter) {
          const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', catalogState.gender, catalogState.subcategory);
          
          const actualMatches = rawProducts.filter(p => {
            const parsed = this.parsePrice(p.price);
            if (parsed === 0) return true;
            if (priceFilter.minPrice !== null && parsed < priceFilter.minPrice) return false;
            if (priceFilter.maxPrice !== null && parsed > priceFilter.maxPrice) return false;
            return true;
          });

          let filtered;
          let customHeader = '';

          if (actualMatches.length > 0) {
            filtered = actualMatches.slice(0, 3);
            customHeader = this.getBudgetHeader(priceFilter, catalogState.subcategory, lang);
          } else {
            filtered = rawProducts.slice(0, 3);
            const prices = rawProducts.map(p => this.parsePrice(p.price)).filter(pr => pr > 0);
            const minPriceVal = prices.length > 0 ? Math.min(...prices) : null;
            customHeader = this.getBudgetHeader(priceFilter, catalogState.subcategory, lang, minPriceVal);
          }

          const updatedState = {
            menuLevel: 'PRODUCTS',
            gender: catalogState.gender,
            subcategory: catalogState.subcategory,
            products: filtered,
            priceFilter: priceFilter
          };

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': updatedState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = updatedState;
          }

          return {
            success: true,
            text: '',
            customHeader,
            scrapedProducts: filtered,
            selectedCategory: catalogState.subcategory,
            language: lang,
            generatedAt: new Date()
          };
        }

        const products = catalogState.products || [];
        const selectedProd = this.detectProductSelection(messageBody, products);

        if (selectedProd) {
          const updatedState = {
            menuLevel: 'PRODUCT_DETAIL',
            gender: catalogState.gender,
            subcategory: catalogState.subcategory,
            products: products,
            selectedProduct: selectedProd,
            priceFilter: activeFilter
          };

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': updatedState
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = updatedState;
          }

          return {
            success: true,
            text: this.localize('product_selected', lang, { name: selectedProd.name, price: selectedProd.price }),
            language: lang,
            generatedAt: new Date()
          };
        } else {
          if (hasPriceFilter) {
            const rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', catalogState.gender, catalogState.subcategory);
            
            const actualMatches = rawProducts.filter(p => {
              const parsed = this.parsePrice(p.price);
              if (parsed === 0) return true;
              if (priceFilter.minPrice !== null && parsed < priceFilter.minPrice) return false;
              if (priceFilter.maxPrice !== null && parsed > priceFilter.maxPrice) return false;
              return true;
            });

            let filtered;
            let customHeader = '';

            if (actualMatches.length > 0) {
              filtered = actualMatches.slice(0, 3);
              customHeader = this.getBudgetHeader(priceFilter, catalogState.subcategory, lang);
            } else {
              filtered = rawProducts.slice(0, 3);
              const prices = rawProducts.map(p => this.parsePrice(p.price)).filter(pr => pr > 0);
              const minPriceVal = prices.length > 0 ? Math.min(...prices) : null;
              customHeader = this.getBudgetHeader(priceFilter, catalogState.subcategory, lang, minPriceVal);
            }

            const updatedState = {
              menuLevel: 'PRODUCTS',
              gender: catalogState.gender,
              subcategory: catalogState.subcategory,
              products: filtered,
              priceFilter: priceFilter
            };

            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': updatedState
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = updatedState;
            }

            return {
              success: true,
              text: '',
              customHeader,
              scrapedProducts: filtered,
              selectedCategory: catalogState.subcategory,
              language: lang,
              generatedAt: new Date()
            };
          }

          if (/^\d+$/.test(lowerMsg)) {
            return {
              success: true,
              text: `Invalid selection. Please choose 1, 2, or 3 from the products listed above, or type *back*.`,
              language: lang,
              generatedAt: new Date()
            };
          } else {
            await Customer.findByIdAndUpdate(customerProfile._id, {
              'customFields.catalogState': null
            });
            if (customerProfile.customFields) {
              customerProfile.customFields.catalogState = null;
            }
            return null;
          }
        }
      }

      if (menuLevel === 'PRODUCT_DETAIL') {
        const isOption1 = ['1', 'one', 'order online', 'order on website', 'online', 'website', 'web link', 'link', 'send link', 'product link', 'buy now', 'add to cart', 'how do i buy this'].includes(lowerMsg) || 
                          (/\border\b/.test(lowerMsg) && /\bwebsite\b/.test(lowerMsg)) ||
                          (/\border\b/.test(lowerMsg) && /\bonline\b/.test(lowerMsg)) ||
                          (catalogState.selectedProduct && lowerMsg === '1');

        const isOption2 = ['2', 'two', 'order here', 'order in chat', 'chat', 'order here in chat', 'here', 'i want this', 'book this'].includes(lowerMsg) ||
                          (/\border\b/.test(lowerMsg) && /\bchat\b/.test(lowerMsg)) ||
                          (/\border\b/.test(lowerMsg) && /\bhere\b/.test(lowerMsg)) ||
                          (catalogState.selectedProduct && lowerMsg === '2');

        const selectedProduct = catalogState.selectedProduct;
        if (isOption1 && selectedProduct) {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return {
            success: true,
            text: this.localize('option_1_checkout', lang, { name: selectedProduct.name, productUrl: selectedProduct.productUrl }),
            language: lang,
            generatedAt: new Date()
          };
        }

        if (isOption2 && selectedProduct) {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return {
            success: true,
            text: this.localize('option_2_checkout', lang, { name: selectedProduct.name, price: selectedProduct.price }),
            language: lang,
            generatedAt: new Date()
          };
        }

        if (/^\d+$/.test(lowerMsg)) {
          return {
            success: true,
            text: `Please reply with "1" to order on our website or "2" to order in chat. You can also type *back* to return to the products list.`,
            language: lang,
            generatedAt: new Date()
          };
        } else {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }
          return null;
        }
      }
    }

    // 5. Global price filtering if no active category catalog state
    if (hasPriceFilter) {
      const CatalogItem = mongoose.model('CatalogItem');
      const query = { userId: customerProfile.userId };
      
      if (priceFilter.minPrice !== null) query.price = { \u0024gte: priceFilter.minPrice };
      if (priceFilter.maxPrice !== null) query.price = { ...query.price, \u0024lte: priceFilter.maxPrice };

      const localItems = await CatalogItem.find(query).limit(3).lean();
      
      if (localItems && localItems.length > 0) {
        const productsList = localItems.map(item => ({
          name: item.name,
          price: `₹${item.price}`,
          imageUrl: item.imageUrl,
          productUrl: (config.websiteUrl || 'https://kanalli.in/')
        }));

        const newState = {
          menuLevel: 'PRODUCTS',
          gender: 'GIFTS', // Generic/fallback group
          subcategory: 'Gifts',
          products: productsList,
          priceFilter: priceFilter
        };

        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.catalogState': newState
        });
        if (customerProfile.customFields) {
          customerProfile.customFields.catalogState = newState;
        }

        return {
          success: true,
          text: '',
          scrapedProducts: productsList,
          selectedCategory: 'Items Matching Budget',
          language: lang,
          generatedAt: new Date()
        };
      }
    }

    // A. Fallback old product check
    const lastScrapedProducts = customerProfile.customFields?.lastScrapedProducts;
    const selectedProduct = customerProfile.customFields?.selectedProduct;

    if (lastScrapedProducts && lastScrapedProducts.length > 0) {
      const selectedProd = this.detectProductSelection(messageBody, lastScrapedProducts);
      if (selectedProd) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.selectedProduct': selectedProd,
          'customFields.lastScrapedProducts': null
        });

        return {
          success: true,
          text: this.localize('product_selected', lang, { name: selectedProd.name, price: selectedProd.price }),
          generatedAt: new Date()
        };
      }
    }

    // Define options selectors
    const isOption1 = ['1', 'one', 'order online', 'order on website', 'online', 'website', 'web link', 'link'].includes(lowerMsg) || 
                      (/\border\b/.test(lowerMsg) && /\bwebsite\b/.test(lowerMsg)) ||
                      (/\border\b/.test(lowerMsg) && /\bonline\b/.test(lowerMsg)) ||
                      (selectedProduct && lowerMsg === '1');

    const isOption2 = ['2', 'two', 'order here', 'order in chat', 'chat', 'order here in chat', 'here'].includes(lowerMsg) ||
                      (/\border\b/.test(lowerMsg) && /\bchat\b/.test(lowerMsg)) ||
                      (/\border\b/.test(lowerMsg) && /\bhere\b/.test(lowerMsg)) ||
                      (selectedProduct && lowerMsg === '2');

    // B. Check if a product checkout option is active
    if (selectedProduct) {
      if (isOption1) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.selectedProduct': null
        });
        
        return {
          success: true,
          text: this.localize('option_1_checkout', lang, { name: selectedProduct.name, productUrl: selectedProduct.productUrl }),
          generatedAt: new Date()
        };
      }
      
      if (isOption2) {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.selectedProduct': null
        });

        return {
          success: true,
          text: this.localize('option_2_checkout', lang, { name: selectedProduct.name, price: selectedProduct.price }),
          generatedAt: new Date()
        };
      }
    }

    // 1. Fallback Category Website Order Check
    if (isOption1) {
      const selectedCategory = await this.getLastSelectedCategory(customerProfile._id);
      
      const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
      let categoryUrl = base;
      let catName = '';

      if (selectedCategory) {
        let path = '';
        const catUpper = selectedCategory.toUpperCase();
        if (catUpper === 'RINGS') path = 'product-category/women/rings/';
        else if (catUpper === 'NECKLACES' || catUpper === 'NECKLACE') path = 'product-category/women/necklace/';
        else if (catUpper === 'BANGLES' || catUpper === 'BANGLE') path = 'product-category/women/bangle/';
        else if (catUpper === 'EARRINGS' || catUpper === 'EARRING') path = 'product-category/women/earrings/';
        else if (catUpper === 'SHOW_MORE') path = 'product-category/all-products/';
        categoryUrl = `${base}${path}`;
        
        catName = catUpper === 'SHOW_MORE' ? '' : ` ` + `*${selectedCategory.toLowerCase()}*`;
      }

      return {
        success: true,
        text: this.localize('option_1_category', lang, { catName, categoryUrl }),
        generatedAt: new Date()
      };
    }

    // 2. Fallback Category Chat Order Check
    if (isOption2) {
      return {
        success: true,
        text: this.localize('option_2_category', lang),
        generatedAt: new Date()
      };
    }

    // 3. Template Matching based on analyzed intent
    if (analysis && analysis.intent) {
      const templateCategory = this.getTemplateCategoryForIntent(analysis.intent);
      if (templateCategory) {
        const Template = mongoose.model('Template');
        const matchedTemplate = await Template.findOne({
          userId: customerProfile.userId,
          category: templateCategory,
          isActive: true
        }).lean();

        if (matchedTemplate) {
          // Async update stats
          Template.findByIdAndUpdate(matchedTemplate._id, {
            \u0024inc: { usageCount: 1 },
            lastUsedAt: new Date()
          }).catch(err => console.error('Failed to update template stats:', err.message));

          const aiSmartFeatures = require('./aiSmartFeatures');
          const personalizedText = await aiSmartFeatures.personalizeMessage(matchedTemplate.content, customerProfile);

          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': null
          });
          if (customerProfile.customFields) {
            customerProfile.customFields.catalogState = null;
          }

          return {
            success: true,
            text: personalizedText,
            mediaUrl: matchedTemplate.mediaUrl || null,
            language: lang,
            generatedAt: new Date()
          };
        }
      }
    }

    const guideDirectResponse = this.getGuideDirectResponse(messageBody, config, lang);
    if (guideDirectResponse) {
      return {
        success: true,
        text: guideDirectResponse,
        language: lang,
        generatedAt: new Date()
      };
    }

    // 4. Check for payment, order status, admin contact, or "more things"
    const adminKeywords = [
      'pay', 'payment', 'gpay', 'phonepe', 'bank', 'upi', 'transfer', 'cod', 'cash', 'credit card', 'debit card', 'card payment', 'netbanking', 'upi payment', 'payment number', 'how to pay',
      'status', 'track', 'where is my', 'order id', 'order status', 'shipped', 'delivered', 'cancel', 'return',
      'call', 'contact', 'phone', 'number', 'talk to', 'speak to', 'human', 'admin', 'manager', 'owner', 'whatsapp number'
    ];

    const hasAdminKeyword = adminKeywords.some(kw => {
      const escaped = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(lowerMsg);
    });

    if (hasAdminKeyword) {
      return {
        success: true,
        text: this.localize('admin_contact', lang, { phone: config.contactPhone || '+91 9345578103' }),
        generatedAt: new Date()
      };
    }

    return null;
  }
}

module.exports = new AIMessageAnalyzer();
