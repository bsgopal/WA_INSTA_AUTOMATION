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
    courier_delivered: "Thanks for the update. Your package is marked as delivered. If anything is incorrect or you did not receive it, please contact us at {phone} so our team can help.",
    courier_out_for_delivery: "Thanks for the update. Your package is out for delivery today. Please keep your phone available for the delivery agent. For any address or mobile number change, contact us at {phone}.",
    courier_status_update: "Thanks for sharing the delivery update. We have noted the order status. For any help with this shipment, please contact us at {phone}.",
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
    closing_response: "Thank you for visiting Renic Jewellers! We will be here whenever you need help finding something beautiful.",
    faq_showroom: "Yes, we have a showroom! You can visit us during business hours. We'd love to see you.",
    faq_online_shopping: "Absolutely! You can shop securely on our website 24/7. All payments are encrypted and safe.",
    faq_shipping_india: "Yes! We ship all across India. Delivery usually takes 3-5 business days.",
    faq_shipping_intl: "Yes, we ship internationally to select countries including USA, UK, UAE, Canada, etc. Shipping takes 10-15 days.",
    faq_certification: "Yes! All our gold jewelry is BIS Hallmarked (22K, 18K, 14K) and our diamonds are IGI/GIA certified.",
    faq_invoice_gst: "Yes, you will receive a proper tax invoice. Applicable GST is calculated and shown transparently at checkout.",
    faq_video_shopping: "Yes! We offer live WhatsApp video calls and virtual consultations. Let us know when you are free!",
    faq_gold_schemes: "Yes, we offer gold savings and investment schemes. Let us know if you want more details!",
    faq_lab_grown: "Yes, we offer both natural and eco-friendly lab-grown diamonds. They have the exact same properties!",
    faq_products: "We offer premium gold, diamond, silver, and platinum jewellery including bridal, daily wear, and customized pieces.",
    faq_support: "You can contact our support team via WhatsApp, phone call at {phone}, or email. We are happy to help!",
    faq_reserve: "Yes, selected products can be reserved for a limited period. Please let us know which item you want to hold.",
    faq_vouchers: "Yes, we offer gift vouchers! They are a perfect present for your loved ones.",
    faq_22k_meaning: "22K gold contains 91.6% pure gold (916 hallmark), making it ideal for traditional and investment jewelry.",
    faq_18k_meaning: "18K gold contains 75% pure gold. It's stronger than 22K and perfect for diamond and daily wear jewelry.",
    faq_4cs: "The 4Cs of diamonds are Cut, Color, Clarity, and Carat Weight. We ensure top quality in all four!",
    faq_solitaire: "Yes! We have a beautiful collection of solitaire diamond rings perfect for engagements and special occasions."
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
    more_collections_prompt: "क्या आप हमारे संग्रह से अधिक देखना चाहते हैं? 📦\n\nयहाँ सब कुछ देखें:\n🔗 {collectionsUrl}\n\nया मुझे बताएं कि आप क्या ढूंढ रहे हैं और मैं आपकी मदद करूँगा!",
    faq_showroom: "हां, हमारा एक शोरूम है! आप व्यावसायिक घंटों के दौरान हमसे मिल सकते हैं। हमें आपसे मिलकर खुशी होगी।",
    faq_online_shopping: "बिल्कुल! आप हमारी वेबसाइट पर सुरक्षित रूप से खरीदारी कर सकते हैं। सभी भुगतान एन्क्रिप्टेड और सुरक्षित हैं।",
    faq_shipping_india: "हां! हम पूरे भारत में शिप करते हैं। डिलीवरी में आमतौर पर 3-5 कार्यदिवस लगते हैं।",
    faq_shipping_intl: "हां, हम चुनिंदा देशों में अंतरराष्ट्रीय स्तर पर शिप करते हैं। डिलीवरी में 10-15 दिन लगते हैं।",
    faq_certification: "हां! हमारे सभी सोने के आभूषण BIS हॉलमार्क वाले हैं और हीरे IGI/GIA प्रमाणित हैं।",
    faq_invoice_gst: "हां, आपको उचित टैक्स चालान (Invoice) मिलेगा। चेकआउट के समय GST पारदर्शी रूप से दिखाया जाता है।",
    faq_video_shopping: "हां! हम व्हाट्सएप वीडियो कॉल और वर्चुअल परामर्श प्रदान करते हैं। हमें बताएं कि आप कब फ्री हैं!",
    faq_gold_schemes: "हां, हम स्वर्ण बचत (Gold Saving) और निवेश योजनाएं प्रदान करते हैं। अधिक जानकारी के लिए हमें बताएं!",
    faq_lab_grown: "हां, हम प्राकृतिक और लैब-ग्रोन दोनों प्रकार के हीरे प्रदान करते हैं!",
    faq_products: "हम प्रीमियम सोना, हीरा, चांदी और प्लैटिनम आभूषण प्रदान करते हैं, जिनमें ब्राइडल, डेली वियर और कस्टमाइज्ड पीस शामिल हैं।",
    faq_support: "आप हमारी सपोर्ट टीम से व्हाट्सएप, फोन कॉल ({phone}) या ईमेल के माध्यम से संपर्क कर सकते हैं।",
    faq_reserve: "हां, चुनिंदा उत्पादों को सीमित अवधि के लिए आरक्षित (reserve) किया जा सकता है।",
    faq_vouchers: "हां, हम गिफ्ट वाउचर प्रदान करते हैं! यह अपनों को उपहार देने के लिए बेहतरीन विकल्प है।",
    faq_22k_meaning: "22K सोने में 91.6% शुद्ध सोना (916 हॉलमार्क) होता है, जो पारंपरिक आभूषणों और निवेश के लिए आदर्श है।",
    faq_18k_meaning: "18K सोने में 75% शुद्ध सोना होता है। यह 22K से अधिक मजबूत है और हीरे के गहनों के लिए एकदम सही है।",
    faq_4cs: "हीरे के 4C हैं - कट (Cut), कलर (Color), क्लैरिटी (Clarity) और कैरेट (Carat Weight)।",
    faq_solitaire: "हां! हमारे पास सॉलिटेयर डायमंड रिंग्स (solitaire rings) का एक सुंदर संग्रह है।"
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
    more_collections_prompt: "எங்கள் சேகரணத்திலிருந்து மேலும் பார்க்க விரும்புகிறீர்களா? 📦\n\nஇங்கே சகல பொருட்களை பாருங்கள்:\n🔗 {collectionsUrl}\n\nஅல்லது நீங்கள் என்ன தேடுகிறீர்கள் என்பதை சொல்லி விட்டால் நான் உங்களுக்கு உதவுவேன்!",
    faq_showroom: "ஆம், எங்களுக்கு ஷோரூம் உள்ளது! வேலை நேரங்களில் நீங்கள் எங்களை சந்திக்கலாம்.",
    faq_online_shopping: "நிச்சயமாக! எங்கள் இணையதளத்தில் நீங்கள் பாதுகாப்பாக ஷாப்பிங் செய்யலாம்.",
    faq_shipping_india: "ஆம்! இந்தியா முழுவதும் நாங்கள் டெலிவரி செய்கிறோம். 3-5 நாட்களில் கிடைக்கும்.",
    faq_shipping_intl: "ஆம், நாங்கள் வெளிநாடுகளுக்கும் டெலிவரி செய்கிறோம். 10-15 நாட்கள் ஆகும்.",
    faq_certification: "ஆம்! எங்கள் அனைத்து தங்க நகைகளும் BIS ஹால்மார்க் மற்றும் வைரங்கள் IGI/GIA சான்றிதழ் பெற்றவை.",
    faq_invoice_gst: "ஆம், நீங்கள் சரியான வரி ரசீதைப் பெறுவீர்கள் (GST Invoice).",
    faq_video_shopping: "ஆம்! நாங்கள் வாட்ஸ்அப் வீடியோ கால் மூலம் நகைகளை காட்டுகிறோம்.",
    faq_gold_schemes: "ஆம், எங்களிடம் தங்க சேமிப்பு திட்டங்கள் உள்ளன. விவரங்களுக்கு எங்களை தொடர்பு கொள்ளவும்!",
    faq_lab_grown: "ஆம், எங்களிடம் இயற்கை மற்றும் லேப்-க்ரோன் வைரங்கள் (Lab-grown diamonds) உள்ளன!",
    faq_products: "நாங்கள் பிரீமியம் தங்கம், வைரம், வெள்ளி மற்றும் பிளாட்டினம் நகைகளை வழங்குகிறோம்.",
    faq_support: "எங்கள் வாடிக்கையாளர் சேவையை வாட்ஸ்அப் அல்லது {phone} மூலம் தொடர்பு கொள்ளலாம்.",
    faq_reserve: "ஆம், குறிப்பிட்ட நகைகளை சில நாட்களுக்கு முன்பதிவு (reserve) செய்யலாம்.",
    faq_vouchers: "ஆம், நாங்கள் பரிசு வவுச்சர்களை (Gift Vouchers) வழங்குகிறோம்!",
    faq_22k_meaning: "22K தங்கத்தில் 91.6% தூய தங்கம் (916 ஹால்மார்க்) உள்ளது.",
    faq_18k_meaning: "18K தங்கத்தில் 75% தூய தங்கம் உள்ளது. இது வைர நகைகளுக்கு மிகவும் சிறந்தது.",
    faq_4cs: "வைரத்தின் 4C-கள்: Cut, Color, Clarity, மற்றும் Carat Weight.",
    faq_solitaire: "ஆம்! நிச்சயதார்த்தத்திற்கு ஏற்ற சிறந்த சாலிடைர் (Solitaire) வைர மோதிரங்கள் எங்களிடம் உள்ளன."
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
    customization_reference: "డిజైన్ చిత్రాన్ని పంచుకున్నందుకు ధన్యవాదాలు! 💍 మా జ్యువెలరీ డిజైనర్ దీని ఆధారంగా మీ నగను కస్టమైజ్ చేయడానికి పరిశీలించి త్వరలోనే మిమ్మల్ని సంప్రదిస్తారు.",
    faq_showroom: "అవును, మాకు షోరూమ్ ఉంది! పని వేళల్లో మీరు మమ్మల్ని సందర్శించవచ్చు.",
    faq_online_shopping: "ఖచ్చితంగా! మీరు మా వెబ్‌సైట్‌లో సురక్షితంగా షాపింగ్ చేయవచ్చు.",
    faq_shipping_india: "అవును! మేము భారతదేశం అంతటా డెలివరీ చేస్తాము. 3-5 రోజులు పడుతుంది.",
    faq_shipping_intl: "అవును, మేము విదేశాలకు కూడా డెలివరీ చేస్తాము. 10-15 రోజులు పడుతుంది.",
    faq_certification: "అవును! మా బంగారు నగలన్నీ BIS హాల్‌మార్క్ మరియు వజ్రాలు IGI/GIA సర్టిఫికేట్ పొందాయి.",
    faq_invoice_gst: "అవును, మీకు సరైన పన్ను ఇన్‌వాయిస్ (GST Invoice) లభిస్తుంది.",
    faq_video_shopping: "అవును! మేము వాట్సాప్ వీడియో కాల్ ద్వారా నగలను చూపిస్తాము.",
    faq_gold_schemes: "అవును, మా వద్ద బంగారు పొదుపు పథకాలు ఉన్నాయి. వివరాల కోసం మాకు తెలియజేయండి!",
    faq_lab_grown: "అవును, మా వద్ద సహజ మరియు ల్యాబ్-గ్రోన్ వజ్రాలు (Lab-grown diamonds) ఉన్నాయి!",
    faq_products: "మేము ప్రీమియం బంగారం, వజ్రం, వెండి మరియు ప్లాటినం నగలను అందిస్తాము.",
    faq_support: "మీరు మా కస్టమర్ సపోర్ట్‌ను వాట్సాప్ లేదా {phone} ద్వారా సంప్రదించవచ్చు.",
    faq_reserve: "అవును, ఎంచుకున్న నగలను కొంతకాలం వరకు రిజర్వ్ (reserve) చేయవచ్చు.",
    faq_vouchers: "అవును, మేము గిఫ్ట్ వోచర్‌లను (Gift Vouchers) అందిస్తున్నాము!",
    faq_22k_meaning: "22K బంగారంలో 91.6% స్వచ్ఛమైన బంగారం (916 హాల్‌మార్క్) ఉంటుంది.",
    faq_18k_meaning: "18K బంగారంలో 75% స్వచ్ఛమైన బంగారం ఉంటుంది. ఇది వజ్రాల నగలకు అనువైనది.",
    faq_4cs: "వజ్రాల 4C లు: కట్ (Cut), కలర్ (Color), క్లారిటీ (Clarity), క్యారెట్ (Carat).",
    faq_solitaire: "అవును! మా వద్ద అందమైన సాలిటైర్ (Solitaire) డైమండ్ రింగులు ఉన్నాయి."
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
    more_collections_prompt: "आमच्या संग्रहमधून अधिक पाहू इच्छिता? 📦\n\nयेथे सर्व काही पाहा:\n🔗 {collectionsUrl}\n\nकिंवा मुझे सांगा तुम्ही काय शोधत आहात आणि मी तुम्हाला मदत करेन!",
    faq_showroom: "होय, आमचे शोरूम आहे! तुम्ही कामाच्या वेळेत आम्हाला भेट देऊ शकता.",
    faq_online_shopping: "नक्कीच! तुम्ही आमच्या वेबसाइटवर सुरक्षितपणे खरेदी करू शकता.",
    faq_shipping_india: "होय! आम्ही संपूर्ण भारतात डिलिव्हरी करतो. ३-५ दिवस लागतात.",
    faq_shipping_intl: "होय, आम्ही परदेशातही डिलिव्हरी करतो. १०-१५ दिवस लागतात.",
    faq_certification: "होय! आमचे सर्व सोन्याचे दागिने BIS हॉलमार्क आहेत आणि हिरे IGI/GIA प्रमाणित आहेत.",
    faq_invoice_gst: "होय, तुम्हाला योग्य टॅक्स इन्व्हॉइस (GST Invoice) मिळेल.",
    faq_video_shopping: "होय! आम्ही व्हॉट्सॲप व्हिडिओ कॉलद्वारे दागिने दाखवतो.",
    faq_gold_schemes: "होय, आमच्याकडे सुवर्ण बचत योजना आहेत. अधिक माहितीसाठी आम्हाला सांगा!",
    faq_lab_grown: "होय, आमच्याकडे नैसर्गिक आणि लॅब-ग्रोन हिरे (Lab-grown diamonds) आहेत!",
    faq_products: "आम्ही प्रीमियम सोने, हिरे, चांदी आणि प्लॅटिनम दागिने प्रदान करतो.",
    faq_support: "तुम्ही आमच्या सपोर्ट टीमशी व्हॉट्सॲप किंवा फोन कॉलवर ({phone}) संपर्क साधू शकता.",
    faq_reserve: "होय, निवडक उत्पादने काही काळासाठी राखीव (reserve) ठेवली जाऊ शकतात.",
    faq_vouchers: "होय, आम्ही गिफ्ट वाउचर्स (Gift Vouchers) देतो!",
    faq_22k_meaning: "22K सोन्यात 91.6% शुद्ध सोने (916 हॉलमार्क) असते.",
    faq_18k_meaning: "18K सोन्यात 75% शुद्ध सोने असते. हे हिऱ्यांच्या दागिन्यांसाठी योग्य आहे.",
    faq_4cs: "हिऱ्यांचे 4C आहेत - कट (Cut), कलर (Color), क्लॅरिटी (Clarity), आणि कॅरेट (Carat).",
    faq_solitaire: "होय! आमच्याकडे सॉलिटेअर (Solitaire) हिऱ्यांच्या अंगठ्यांचे सुंदर कलेक्शन आहे."
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
    customization_reference: "ವಿನ್ಯಾಸದ ಚಿತ್ರವನ್ನು ಹಂಚಿಕೊಂಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! 💍 ನಮ್ಮ ಆಭರಣ ವಿನ್ಯಾಸಕರು ನಿಮ್ಮ ಆಭರಣವನ್ನು ಕಸ್ಟಮೈಸ್ ಮಾಡಲು ಈ ಚಿತ್ರವನ್ನು ಪರಿಶೀಲಿಸಿ ಶೀಘ್ರದಲ್ಲೇ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತಾರೆ.",
    faq_showroom: "ಹೌದು, ನಮ್ಮ ಶೋರೂಮ್ ಇದೆ! ಕೆಲಸದ ವೇಳೆಯಲ್ಲಿ ನೀವು ಭೇಟಿ ನೀಡಬಹುದು.",
    faq_online_shopping: "ಖಂಡಿತ! ನಮ್ಮ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನೀವು ಸುರಕ್ಷಿತವಾಗಿ ಶಾಪಿಂಗ್ ಮಾಡಬಹುದು.",
    faq_shipping_india: "ಹೌದು! ನಾವು ಭಾರತದಾದ್ಯಂತ ವಿತರಣೆ ಮಾಡುತ್ತೇವೆ. 3-5 ದಿನಗಳು ಬೇಕಾಗುತ್ತದೆ.",
    faq_shipping_intl: "ಹೌದು, ನಾವು ವಿದೇಶಗಳಿಗೂ ವಿತರಣೆ ಮಾಡುತ್ತೇವೆ. 10-15 ದಿನಗಳು ಬೇಕಾಗುತ್ತದೆ.",
    faq_certification: "ಹೌದು! ನಮ್ಮ ಎಲ್ಲಾ ಚಿನ್ನದ ಆಭರಣಗಳು BIS ಹಾಲ್‌ಮಾರ್ಕ್ ಮತ್ತು ವಜ್ರಗಳು IGI/GIA ಪ್ರಮಾಣೀಕರಿಸಲ್ಪಟ್ಟಿವೆ.",
    faq_invoice_gst: "ಹೌದು, ನೀವು ಸರಿಯಾದ ತೆರಿಗೆ ಇನ್‌ವಾಯ್ಸ್ (GST Invoice) ಪಡೆಯುತ್ತೀರಿ.",
    faq_video_shopping: "ಹೌದು! ನಾವು ವಾಟ್ಸಾಪ್ ವೀಡಿಯೊ ಕಾಲ್ ಮೂಲಕ ಆಭರಣಗಳನ್ನು ತೋರಿಸುತ್ತೇವೆ.",
    faq_gold_schemes: "ಹೌದು, ನಮ್ಮಲ್ಲಿ ಚಿನ್ನದ ಉಳಿತಾಯ ಯೋಜನೆಗಳಿವೆ. ವಿವರಗಳಿಗಾಗಿ ನಮಗೆ ತಿಳಿಸಿ!",
    faq_lab_grown: "ಹೌದು, ನಮ್ಮಲ್ಲಿ ನೈಸರ್ಗಿಕ ಮತ್ತು ಲ್ಯಾಬ್-ಗ್ರೋನ್ ವಜ್ರಗಳು (Lab-grown diamonds) ಇವೆ!",
    faq_products: "ನಾವು ಪ್ರೀಮಿಯಂ ಚಿನ್ನ, ವಜ್ರ, ಬೆಳ್ಳಿ ಮತ್ತು ಪ್ಲಾಟಿನಂ ಆಭರಣಗಳನ್ನು ನೀಡುತ್ತೇವೆ.",
    faq_support: "ನಮ್ಮ ಗ್ರಾಹಕ ಸೇವೆಯನ್ನು ವಾಟ್ಸಾಪ್ ಅಥವಾ {phone} ಮೂಲಕ ಸಂಪರ್ಕಿಸಬಹುದು.",
    faq_reserve: "ಹೌದು, ಆಯ್ದ ಆಭರಣಗಳನ್ನು ಕೆಲವು ದಿನಗಳವರೆಗೆ ಕಾಯ್ದಿರಿಸಬಹುದು (reserve).",
    faq_vouchers: "ಹೌದು, ನಾವು ಗಿಫ್ಟ್ ವೋಚರ್‌ಗಳನ್ನು (Gift Vouchers) ನೀಡುತ್ತೇವೆ!",
    faq_22k_meaning: "22K ಚಿನ್ನದಲ್ಲಿ 91.6% ಶುದ್ಧ ಚಿನ್ನ (916 ಹಾಲ್‌ಮಾರ್ಕ್) ಇರುತ್ತದೆ.",
    faq_18k_meaning: "18K ಚಿನ್ನದಲ್ಲಿ 75% ಶುದ್ಧ ಚಿನ್ನ ಇರುತ್ತದೆ. ಇದು ವಜ್ರದ ಆಭರಣಗಳಿಗೆ ಅತ್ಯುತ್ತಮವಾಗಿದೆ.",
    faq_4cs: "ವಜ್ರದ 4C ಗಳು: Cut, Color, Clarity, ಮತ್ತು Carat.",
    faq_solitaire: "ಹೌದು! ನಮ್ಮಲ್ಲಿ ಸುಂದರವಾದ ಸಾಲಿಟೇರ್ (Solitaire) ವಜ್ರದ ಉಂಗುರಗಳಿವೆ."
  }
};class AIMessageAnalyzer {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not set. AI analysis will be limited unless configured by user.');
    }
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

  extractCourierNotification(message = '') {
    const text = String(message || '').trim();
    const lower = text.toLowerCase();
    if (!text) return null;

    const hasCourierSignal = [
      'amazon package',
      'package',
      'order id',
      'order number',
      'tracking status',
      'track your delivery',
      'view your order',
      'review your purchase',
      'out for delivery',
      'delivery agent',
      'delivered successfully',
      'did not get the package',
      'update address/mobile'
    ].some(signal => lower.includes(signal));

    const hasOrderId = /\border\s*(?:id|number|#)?\s*[:#-]?\s*\d{3}[-\d]{6,}/i.test(text);
    const hasShipmentLanguage = /\b(package|shipment|parcel|tracking|delivered|delivery)\b/i.test(text);
    if (!hasCourierSignal && !(hasOrderId && hasShipmentLanguage)) return null;

    const orderMatch = text.match(/\border\s*(?:id|number|#)?\s*[:#-]?\s*([0-9][0-9-]{6,})/i);
    let status = 'status_update';
    if (/\bdelivered\b/i.test(text)) {
      status = 'delivered';
    } else if (/\b(arriving today|out for delivery|delivery agent)\b/i.test(text)) {
      status = 'out_for_delivery';
    } else if (/\b(did not get|not received|missing package|didn'?t receive)\b/i.test(text)) {
      status = 'not_received';
    } else if (/\b(update address|mobile no|phone number|address change)\b/i.test(text)) {
      status = 'address_update';
    }

    return {
      status,
      orderId: orderMatch?.[1] || null,
      source: lower.includes('amazon') ? 'amazon' : null
    };
  }

  buildCourierNotificationResponse(notification, language = 'en', config = {}) {
    const phone = config.contactPhone || '+91 9345578103';
    const responseKey = notification?.status === 'delivered'
      ? 'courier_delivered'
      : notification?.status === 'out_for_delivery'
        ? 'courier_out_for_delivery'
        : 'courier_status_update';

    return this.localize(responseKey, language, { phone });
  }

  /**
   * Helper to execute Gemini generation with rate-limit retry and exponential backoff
   */
  async generateContentWithRetry(prompt, aiConfig, retries = 5, initialDelay = 3000) {
    const provider = aiConfig?.provider || 'gemini';
    const apiKey = aiConfig?.apiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error(`${provider.toUpperCase()}_API_KEY not set`);
    }
    
    let delay = initialDelay;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (provider === 'anthropic') {
          const axios = require('axios');
          const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: aiConfig.model || 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }]
          }, {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
            }
          });
          // Mock gemini response interface to prevent breaking existing logic
          return {
            response: { text: () => response.data.content[0].text }
          };
        } else {
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: aiConfig.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
          return await model.generateContent(prompt);
        }
      } catch (err) {
        const errMsg = err.message || '';
        const anthropicError = err.response?.data?.error?.message || '';
        const fullError = errMsg + ' ' + anthropicError;

        const isRateLimit = fullError.includes('429') || 
                            fullError.includes('Quota') || 
                            fullError.includes('Too Many Requests') || 
                            fullError.includes('RESOURCE_EXHAUSTED') || 
                            err.response?.status === 429 ||
                            err.status === 429;
                            
        const isCreditError = fullError.includes('credit balance') || 
                              fullError.includes('insufficient_quota') ||
                              err.response?.status === 402;

        const isDailyLimit = fullError.includes('GenerateRequestsPerDay') || 
                             fullError.includes('limit: 20') ||
                             fullError.includes('daily');
                            
        if (isRateLimit && !isDailyLimit && !isCreditError && attempt < retries) {
          console.warn(`⚠️ ${provider} API Rate Limit (429) hit. Retrying in ${(delay / 1000).toFixed(1)}s (Attempt ${attempt}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        } else {
          const finalErr = new Error(anthropicError || errMsg);
          finalErr.isQuotaError = isCreditError || isDailyLimit || isRateLimit;
          finalErr.provider = provider;
          throw finalErr;
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
      useAnthropic: false,
      anthropicApiKey: '',
      anthropicModel: 'claude-3-haiku-20240307',
      geminiApiKey: '',
      geminiModel: 'gemini-1.5-flash',
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
    if (text.includes('ring') || text === '1' || text.startsWith('1.') || text.includes('rings') || text.includes('अंगूठी') || text.includes('மோதிர') || text.includes('ఉంగర') || text.includes('अंगठ्या') || text.includes('ಉಂಗುರ') || text.includes('mothiram') || text.includes('anguthi') || text.includes('unguram')) return 'RINGS';
    if (text.includes('necklace') || text === '2' || text.startsWith('2.') || text.includes('necklaces') || text.includes('हार') || text.includes('நெக்லஸ்') || text.includes('నెక్లెస్') || text.includes('ಹಾರ') || text.includes('mala') || text.includes('haar')) return 'NECKLACES';
    if (text.includes('bangle') || text === '3' || text.startsWith('3.') || text.includes('bangles') || text.includes('चूड़ी') || text.includes('வளையல்') || text.includes('గాజు') || text.includes('बांगड्या') || text.includes('ಬಳೆ') || text.includes('valayal') || text.includes('chudi') || text.includes('kangan') || text.includes('gajulu')) return 'BANGLES';
    if (text.includes('earring') || text === '4' || text.startsWith('4.') || text.includes('earrings') || text.includes('झुमके') || text.includes('கம்மல்') || text.includes('చెవి') || text.includes('ओಲೆ') || text.includes('jhumka') || text.includes('kammal') || text.includes('jhumki')) return 'EARRINGS';
    if (text.includes('pendant') || text === '5' || text.startsWith('5.') || text.includes('pendants') || text.includes('पेंडेंट') || text.includes('பதக்கம்') || text.includes('లాకెட்') || text.includes('ಪೆಂಡೆಂಟ್') || text.includes('పెండెంట్') || text.includes('locket') || text.includes('padakkam') || text.includes('dollar')) return 'PENDANT';
    if (text.includes('nose') || text === '6' || text.startsWith('6.') || text.includes('नाक') || text.includes('மூக்கு') || text.includes('முக்கு') || text.includes('ನತ್') || text.includes('ಮೂಗು') || text.includes('mukkuthi') || text.includes('nath')) return 'NOSE_PINS';
    if (text.includes('bracelet') || text.includes('bracelets') || text.includes('कंगन') || text.includes('காப்பு') || text.includes('బ్రాస్లెట్') || text.includes('कडे') || text.includes('ಕೈಕಡ') || text.includes('kappu') || text.includes('kadiyam')) return 'BRACELET';
    if (text.includes('chain') || text.includes('chains') || text.includes('चेन') || text.includes('செயின்') || text.includes('చైన్') || text.includes('ಸರ') || text.includes('sangili')) return 'CHAINS';
    
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
        const regex = /href="([^"]+)"/g;
      const paths = new Set();
      let match;
      while ((match = regex.exec(html)) !== null) {
          let href = match[1];
          const urlWithoutQuery = href.split('?')[0].split('#')[0];
          // Exclude assets, scripts, and external links
          if (urlWithoutQuery.match(/\.(jpg|jpeg|png|gif|svg|pdf|css|js|woff2?|ico|webmanifest)$/i)) continue;
          if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;
          
          if (href.startsWith(normalizedUrl)) {
            paths.add(href.replace(normalizedUrl, ''));
          } else if (href.startsWith('/') && !href.startsWith('//')) {
            paths.add(href.substring(1));
          } else if (!href.startsWith('http') && !href.startsWith('//')) {
            paths.add(href);
          }
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
      // Only extract keywords from paths that clearly indicate a collection/category
      if (!path.includes('category') && !path.includes('collection') && !path.includes('shop') && !path.includes('store')) continue;
      
      const cleanPath = path.replace(/\/$/, '');
      const parts = cleanPath.split('/');
      const last = parts[parts.length - 1];
      if (last && last.length > 2) {
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
          path: path
        });
      }
    }
    return keywords;
  }

  async getDynamicShopUrl(websiteUrl) {
    if (!websiteUrl) return 'shop/';
    const normalizedUrl = websiteUrl.endsWith('/') ? websiteUrl : `${websiteUrl}/`;
    
    if (!this.dynamicShopUrlCache) this.dynamicShopUrlCache = {};
    const cached = this.dynamicShopUrlCache[normalizedUrl];
    const cacheDuration = 24 * 60 * 60 * 1000;
    if (cached && (Date.now() - cached.fetchedAt < cacheDuration)) {
      return cached.url;
    }

    try {
      const paths = await this.fetchCategoryPathsFromWebsite(websiteUrl);
      let bestMatch = 'shop/';
      let highestScore = 0;
      
      for (const p of paths) {
        const lowerP = p.toLowerCase();
        if (lowerP.includes('cart') || lowerP.includes('checkout') || lowerP.includes('my-account') || lowerP.includes('wp-') || lowerP.includes('login')) continue;

        let score = 0;
        if (lowerP === 'shop' || lowerP === 'shop/') score += 20;
        else if (lowerP === 'store' || lowerP === 'store/') score += 15;
        else if (lowerP === 'products' || lowerP === 'products/') score += 15;
        else if (lowerP === 'collections' || lowerP === 'collections/') score += 10;
        else if (lowerP.includes('all-products')) score += 10;
        else if (lowerP.includes('shop')) score += 5;

        if (score > highestScore) {
          highestScore = score;
          bestMatch = p;
        }
      }
      
      this.dynamicShopUrlCache[normalizedUrl] = {
        url: bestMatch,
        fetchedAt: Date.now()
      };
      return bestMatch;
    } catch (err) {
      return 'shop/';
    }
  }

  async getDynamicCategoryPath(gender, subcategory, websiteUrl) {
    const subUpper = (subcategory || '').toUpperCase();
    const genUpper = (gender || '').toUpperCase();
    const subLower = subUpper.toLowerCase();
    const genLower = genUpper.toLowerCase();

    // Check for ALL_PRODUCTS / SHOW_MORE to dynamically find the main Shop page
    if (subUpper === 'ALL_PRODUCTS' || subUpper === 'SHOW_MORE') {
      const shopUrl = await this.getDynamicShopUrl(websiteUrl);
      return shopUrl || 'shop/';
    }

    if (websiteUrl) {
      try {
        const paths = await this.fetchCategoryPathsFromWebsite(websiteUrl);
        if (paths && paths.length > 0) {
          let bestMatch = null;
          let highestScore = 0;

          const subSingular = subLower.endsWith('s') ? subLower.slice(0, -1) : subLower;

          for (const p of paths) {
            const lowerP = p.toLowerCase();
            if (lowerP.includes('cart') || lowerP.includes('checkout') || lowerP.includes('my-account') || lowerP.includes('wp-')) continue;

            let score = 0;

            // Subcategory match is strictly required to get a high score
            if (lowerP.includes(`/${subLower}`) || lowerP.includes(`${subLower}/`) || lowerP === subLower || lowerP === `${subLower}/`) score += 20;
            else if (lowerP.includes(subLower)) score += 10;
            else if (lowerP.includes(subSingular)) score += 5;

            // Only proceed if we matched the subcategory somewhat
            if (score > 0) {
              // Gender match boosters
              if (genUpper === 'WOMEN' && (lowerP.includes('women') || lowerP.includes('ladies'))) score += 5;
              if (genUpper === 'MEN' && lowerP.match(/\bmen\b/)) score += 5;
              if (genUpper === 'GIFTS' && lowerP.includes('gift')) score += 5;

              // Category structure boosters (prefer cleaner, higher-level links)
              if (lowerP.includes('category') || lowerP.includes('collection')) score += 3;
              if (lowerP.includes('product-category')) score += 4; 

              // Penalize deep product pages (typically have many segments)
              if (lowerP.split('/').length > 4) score -= 5;

              if (score > highestScore) {
                highestScore = score;
                bestMatch = p;
              }
            }
          }

          if (bestMatch) {
            return bestMatch;
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

    // 4. Fallback budget match (supporting common typos and optional transition words like "is", "are", "around", "of", ":", "=")
    const budgetMatch1 = cleanText.match(/(?:budget|budegt|budjet|bugdet|bujet|limit|around|approx|rs\.?|rupees|inr|₹|for|of)\s*(?:is|are|around|of|:|=)?\s*(\d+)/i);
    const budgetMatch2 = cleanText.match(/(\d+)\s*(?:is my|my)?\s*(?:budget|budegt|budjet|bugdet|bujet|limit)/i);
    
    if (budgetMatch1) {
      maxPrice = parseInt(budgetMatch1[1], 10);
      return { minPrice, maxPrice };
    } else if (budgetMatch2) {
      maxPrice = parseInt(budgetMatch2[1], 10);
      return { minPrice, maxPrice };
    }

    // 5. Plain number match (if message is just a number >= 100, e.g. "3000", "5000", "10k" / "10000", or "10000 rs")
    const plainNumberMatch = cleanText.match(/^\s*(?:rs\.?|₹)?\s*(\d+)\s*(?:rs\.?|rupees|inr|\/-)?\s*$/i);
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

  async buildBudgetProductResponse(products, priceFilter, catalogState, config, lang, customerProfile) {
    const Customer = mongoose.model('Customer');
    const rawProducts = Array.isArray(products) ? products : [];
    const filtered = this.applyPriceFilter(rawProducts, priceFilter);
    const subcategory = catalogState?.subcategory || 'products';
    const gender = catalogState?.gender || 'WOMEN';
    let customHeader = this.getBudgetHeader(priceFilter, subcategory, lang);

    if (filtered.length === 0) {
      const prices = rawProducts.map(p => this.parsePrice(p.price)).filter(price => price > 0);
      const minPriceVal = prices.length > 0 ? Math.min(...prices) : null;
      customHeader = this.getBudgetHeader(priceFilter, subcategory, lang, minPriceVal);
    }

    const responseProducts = filtered.length > 0 ? filtered : rawProducts.slice(0, 3);
    const updatedState = {
      menuLevel: 'PRODUCTS',
      gender,
      subcategory,
      products: responseProducts,
      priceFilter
    };

    if (customerProfile?._id) {
      await Customer.findByIdAndUpdate(customerProfile._id, {
        'customFields.catalogState': updatedState
      });
      if (customerProfile.customFields) {
        customerProfile.customFields.catalogState = updatedState;
      }
    }

    if (responseProducts.length > 0) {
      return {
        success: true,
        text: '',
        customHeader,
        scrapedProducts: responseProducts,
        selectedCategory: subcategory,
        language: lang,
        generatedAt: new Date()
      };
    }

    const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
    const path = await this.getDynamicCategoryPath(gender, subcategory, config.websiteUrl);
    const categoryUrl = `${base}${path}`;
    return {
      success: true,
      text: `${customHeader || 'I could not find matching items for that budget right now.'}\n\nYou can still browse the full collection here:\n${categoryUrl}`,
      scrapedProducts: [],
      selectedCategory: subcategory,
      language: lang,
      generatedAt: new Date()
    };
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
    if (subUpper === 'ALL_PRODUCTS' || subUpper === 'SHOW_MORE') return 'shop/';
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
      const shopPath = await this.getDynamicShopUrl(config.websiteUrl);
      const replyText = this.localize('show_more_catalog', language, { collectionsUrl: `${base}${shopPath}` });

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
      const userId = customerProfile?.userId;
      const config = await this.getShopConfig(userId);
      
      const aiConfig = {
        provider: config.useAnthropic && config.anthropicApiKey ? 'anthropic' : 'gemini',
        apiKey: (config.useAnthropic && config.anthropicApiKey) ? config.anthropicApiKey : (config.geminiApiKey || process.env.GEMINI_API_KEY),
        model: (config.useAnthropic && config.anthropicApiKey) ? (config.anthropicModel || 'claude-3-haiku-20240307') : (config.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash')
      };

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

      // Fast-path: Bypass Gemini for strict navigational commands, numbers, basic greetings, and FAQs to maximize speed
      const lower = normalizedMessage.toLowerCase().trim();
      const courierNotification = this.extractCourierNotification(normalizedMessage);
      if (courierNotification) {
        return {
          intent: 'delivery_query',
          sentiment: courierNotification.status === 'not_received' ? 'NEGATIVE' : 'NEUTRAL',
          urgency: ['not_received', 'address_update'].includes(courierNotification.status) ? 'high' : 'medium',
          timeline: courierNotification.status === 'out_for_delivery' ? 'today' : 'not_specified',
          occasion: 'not_specified',
          stageInJourney: 'post_purchase',
          explicitBudget: null,
          budgetRange: 'not_mentioned',
          productInterest: null,
          followUpNeeded: ['not_received', 'address_update'].includes(courierNotification.status),
          keyPoints: [
            `Courier status: ${courierNotification.status}`,
            ...(courierNotification.orderId ? [`Order ID: ${courierNotification.orderId}`] : [])
          ],
          courierNotification,
          language: this.detectLanguage(normalizedMessage),
          detectedAt: new Date()
        };
      }
      const isFastPath = this.isBackCommand(lower) || /^\d+$/.test(lower) || ['yes', 'yep', 'y', 'no', 'ok', 'okay', 'thanks', 'thank you', 'tq'].includes(lower) || this.isSimpleGreeting(lower) || this.getGuideDirectResponse(normalizedMessage, {}, 'en');

      if (isFastPath) {
        const fallback = this.getFallbackAnalysis(normalizedMessage);
        if (mediaUrl) fallback.mediaUrl = mediaUrl;
        return fallback;
      }

      if (!aiConfig.apiKey) {
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
  "extractedName": null or { "firstName": "Firstname", "lastName": "Lastname" },
  "language": "detect the message language: 'en' for English, 'hi' for Hindi or Hinglish (Hindi typed in English script), 'ta' for Tamil or Tanglish, 'mr' for Marathi, 'te' for Telugu, 'kn' for Kannada or Kanglish"
}

*CRITICAL NAME EXTRACTION RULE: Check if the customer explicitly provides their name in the message (e.g. "I am Priya Sharma", "My name is Rajesh", "Rajesh here"). If so, extract it into "extractedName". If no name is mentioned, "extractedName" must be null.

*CRITICAL LANGUAGE EXTRACTION RULE: The message may be typed in English, native script, or transliterated roman script (e.g. Hinglish, Tanglish, Kanglish). Detect the underlying language ('hi' for Hindi/Hinglish, 'ta' for Tamil/Tanglish, 'kn' for Kannada/Kanglish, 'en' for English, 'mr' for Marathi, etc.) and specify it in the "language" property.

Return ONLY valid JSON, no markdown or extra text.`;

      const result = await this.generateContentWithRetry(prompt, aiConfig);
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
      fallback.aiError = `[${(error.provider || 'AI').toUpperCase()} ERROR] ${error.message}`;
      fallback.isQuotaError = error.isQuotaError;
      
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
      'വില', 'എത്ര',
      'vile', 'yevvalo', 'entha', 'eshtu', 'kitna'
    ];
    const customKeywords = [
      'custom', 'design', 'make', 'bespoke', 'craft',
      'डिज़ाइन', 'बनाना', 'कस्टम', 'बना',
      'வடிவமைப்பு', 'தயாரிப்பு',
      'ఖరీదు', 'డిజైన్',
      'banwana'
    ];
    const purchaseKeywords = [
      'buy', 'order', 'purchase', 'pay', 'want to buy',
      'खरीदना', 'ऑर्डर', 'लेना',
      'வாங்க', 'கொள்முதல்',
      'venum', 'chahiye', 'kavali', 'beku', 'pahije', 'vanganum', 'konnalanu'
    ];
    const deliveryKeywords = [
      'delivery', 'shipping', 'track', 'where is my', 'days ago',
      'डिलीवरी', 'ट्रैक', 'कहाँ',
      'டெலிவரி', 'டிராக்கிங்',
      'eppo varum', 'kab aayega', 'eppudu vastundi'
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
      
      const aiConfig = {
        provider: config.useAnthropic && config.anthropicApiKey ? 'anthropic' : 'gemini',
        apiKey: (config.useAnthropic && config.anthropicApiKey) ? config.anthropicApiKey : (config.geminiApiKey || process.env.GEMINI_API_KEY),
        model: (config.useAnthropic && config.anthropicApiKey) ? (config.anthropicModel || 'claude-3-haiku-20240307') : (config.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash')
      };

      const courierNotification = this.extractCourierNotification(normalizedMessage);
      if (courierNotification) {
        return {
          success: true,
          text: this.buildCourierNotificationResponse(courierNotification, language, config),
          language,
          courierNotification,
          generatedAt: new Date()
        };
      }

      // Check for Option 1/2 or Payment/Admin interceptions
      const interception = await this.checkInterceptions(messageBody, customerProfile, config, analysis, mediaUrl);
      if (interception) {
        return interception;
      }

      const isDefaultName = !customerProfile || customerProfile.firstName === 'Customer';
      const customerName = isDefaultName ? '' : customerProfile.firstName;
      const lowerMsg = normalizedMessage.toLowerCase().trim();

      // Gather Dynamic Context parameters
      let additionalInstructions = '';
      let productsContext = '';
      let scrapedProducts = [];
      let categoryUrl = '';
      let selectedCategory = '';

      // 1. Detect category selection
      const detectedCat = await this.detectCategorySelection(normalizedMessage, config?.websiteUrl);
      if (detectedCat) {
        selectedCategory = detectedCat;
        if (detectedCat === 'SHOW_MORE') {
          const shopPath = await this.getDynamicShopUrl(config.websiteUrl);
          const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
          categoryUrl = `${base}${shopPath}`;
          additionalInstructions += `\n- The customer wants to see more collections or our store catalog. Provide them with this URL to browse all collections: ${categoryUrl}.`;
        } else {
          // Normal category selection - scrape products
          let gender = 'WOMEN';
          const catUpper = detectedCat.toUpperCase();
          if (catUpper === 'BRACELET' || catUpper === 'CHAINS') gender = 'MEN';
          if (catUpper === 'GIFTS' || catUpper === 'GIFT') gender = 'GIFTS';

          const path = await this.getDynamicCategoryPath(gender, detectedCat, config.websiteUrl);
          const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
          categoryUrl = `${base}${path}`;

          let rawProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', gender, detectedCat);
          const priceFilter = this.extractPriceFilter(normalizedMessage);
          const hasPriceFilter = priceFilter.minPrice !== null || priceFilter.maxPrice !== null;
          const activeFilter = hasPriceFilter ? priceFilter : (customerProfile?.customFields?.catalogState?.priceFilter || null);

          let liveProducts = [];
          if (activeFilter) {
            liveProducts = rawProducts.filter(p => {
              const parsed = this.parsePrice(p.price);
              if (parsed === 0) return true;
              if (activeFilter.minPrice !== null && parsed < activeFilter.minPrice) return false;
              if (activeFilter.maxPrice !== null && parsed > activeFilter.maxPrice) return false;
              return true;
            });
            if (liveProducts.length === 0) {
              liveProducts = rawProducts.slice(0, 3);
            } else {
              liveProducts = liveProducts.slice(0, 3);
            }
          } else {
            liveProducts = rawProducts.slice(0, 3);
          }

          // Fallback to local MongoDB items if website is empty
          if (liveProducts.length === 0) {
            try {
              const CatalogItem = mongoose.model('CatalogItem');
              const localItems = await CatalogItem.find({ userId, category: detectedCat }).limit(3).lean();
              liveProducts = localItems || [];
            } catch (err) {
              console.warn('Failed to load local catalog fallback items:', err.message);
            }
          }

          scrapedProducts = liveProducts;
          
          if (liveProducts && liveProducts.length > 0) {
            productsContext = `\nAVAILABLE PRODUCTS IN CATEGORY "${detectedCat}":\n` + liveProducts.map((p, idx) => 
              `- Product [${idx + 1}]: Name: "${p.name}", Price: "${p.price || 'Contact for price'}", Link: "${p.productUrl || categoryUrl}"`
            ).join('\n');
            additionalInstructions += `\n- The customer requested the "${detectedCat}" category. Present these available products to them warmly, listing their names, prices, and details links. Keep it tidy and human-like. Invite them to reply with the number to buy or see ordering options. Mention they can view more designs at: ${categoryUrl}`;
          } else {
            additionalInstructions += `\n- The customer requested the "${detectedCat}" category. We don't have active live designs listed right now. Direct them to browse our full collection at: ${categoryUrl}`;
          }
        }
      }

      // 2. Budget specified without category
      const priceFilter = this.extractPriceFilter(normalizedMessage);
      const hasBudgetOnly = (priceFilter.minPrice !== null || priceFilter.maxPrice !== null) && !detectedCat;
      if (hasBudgetOnly) {
        let budgetDesc = '';
        if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
          budgetDesc = `between ₹${priceFilter.minPrice} and ₹${priceFilter.maxPrice}`;
        } else if (priceFilter.maxPrice !== null) {
          budgetDesc = `under ₹${priceFilter.maxPrice}`;
        } else if (priceFilter.minPrice !== null) {
          budgetDesc = `above ₹${priceFilter.minPrice}`;
        }
        
        // Save budget state to DB for subsequent category choice
        if (customerProfile) {
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.catalogState': {
              menuLevel: 'AWAITING_CATEGORY',
              priceFilter: priceFilter
            }
          });
        }
        additionalInstructions += `\n- The customer specified a budget constraint: ${budgetDesc}. Acknowledge this constraint warmly, and ask them which category (e.g. rings, bangles, earrings, necklace, pendant, chains, bracelet) they would like to explore within this budget.`;
      }

      // 3. Know more products
      const knowMoreKeywords = ['know more', 'more designs', 'show all', 'view all', 'see all', 'browse all', 'और देखें', 'மேலும் பார்க்க', 'మరిన్ని చూడండి', 'सभी देखे'];
      const isKnowMore = knowMoreKeywords.some(kw => lowerMsg.includes(kw));
      if (isKnowMore && customerProfile?.customFields?.catalogState?.subcategory) {
        const subcategory = customerProfile.customFields.catalogState.subcategory;
        const gender = customerProfile.customFields.catalogState.gender || 'WOMEN';
        const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
        const categoryPath = await this.getDynamicCategoryPath(gender, subcategory, config.websiteUrl);
        categoryUrl = `${base}${categoryPath}`;
        additionalInstructions += `\n- The customer wants to see more designs in the "${subcategory}" category. Provide them with this URL to browse the full collection: ${categoryUrl}`;
      }

      // 4. Rate inquiries (22K, 24K, silver)
      if (analysis.intent === 'price_inquiry') {
        if (lowerMsg.includes('22k') || lowerMsg.includes('916')) {
          additionalInstructions += `\n- The customer asked specifically for the 22K gold rate. Respond ONLY with the today's certified 22K Gold rate: ₹${config.goldRate22K}/gram. Do not show the whole rate card.`;
        } else if (lowerMsg.includes('24k') || lowerMsg.includes('24 karat') || lowerMsg.includes('24ct')) {
          additionalInstructions += `\n- The customer asked specifically for the 24K gold rate. Respond ONLY with the today's certified 24K Gold rate: ₹${config.goldRate24K}/gram. Do not show the whole rate card.`;
        } else if (lowerMsg.includes('silver')) {
          additionalInstructions += `\n- The customer asked specifically for the silver rate. Respond ONLY with the today's certified Silver rate: ₹${config.silverRate}/gram. Do not show the whole rate card.`;
        }
      }

      // 5. Reference image message
      if (mediaUrl && this.isReferenceImageMessage(normalizedMessage, analysis)) {
        additionalInstructions += `\n- The customer shared an image reference/design. Acknowledge this with enthusiasm, and politely let them know that our custom jewelry design team will review it and get back to them shortly with options and quotes.`;
      }

      // 6. Support for catalog queries
      const asksCatalogDirect = ['catalog', 'catalogue', 'menu', 'card', 'pdf', 'brochure', 'link'].some(kw => lowerMsg.includes(kw));
      const asksCollectionsGen = ['collection', 'collections', 'design', 'designs', 'piece', 'pieces', 'what do you have', 'items', 'variety', 'varieties'].some(kw => lowerMsg.includes(kw));
      if ((asksCatalogDirect || asksCollectionsGen) && !detectedCat) {
        additionalInstructions += `\n- The customer wants to see our catalog/menu. Share the main website/catalog link with them: ${config.websiteUrl} and ask them what collection (Women's, Men's, Gifts) they want to see.`;
      }

      // 7. Support for general inquiries or greetings
      const isGreeting = ['hi', 'hii', 'hello', 'hey', 'namaste', 'vanakkam', 'namaskara'].some(kw => lowerMsg.startsWith(kw) || lowerMsg === kw);
      if (isGreeting || lowerMsg === '') {
        if (isDefaultName) {
          additionalInstructions += `\n- Greet the customer warmly and politely ask for their name so we can assist them personally.`;
        } else {
          additionalInstructions += `\n- Welcome the customer back by name ("${customerName}") and ask how we can assist them today.`;
        }
      }

      // Standard Gemini generation flow
      if (!aiConfig.apiKey) {
        return await this.getFallbackResponse(analysis, customerProfile, language, normalizedMessage, mediaUrl);
      }

      const matchedCatalog = await this.getMatchingCatalogItems(userId, analysis.productInterest || '');
      let catalogContext = '';
      if (matchedCatalog && matchedCatalog.length > 0) {
        catalogContext = 'RELEVANT CATALOG ITEMS AVAILABLE IN STORE:\n' + matchedCatalog.map(item => 
          `- Name: *${item.name}*\n  Price: *₹${item.price}*\n  Description: ${item.description}\n  Image: ${item.imageUrl}`
        ).join('\n');
      }

      const documentsContext = await this.getOptimizedRAGContext(normalizedMessage, userId);

      const prompt = `
You are a warm, extremely friendly, and professional boutique jewelry representative for "${config.shopName}". You are chatting directly with a customer on WhatsApp/Instagram.

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
${config.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n')}${documentsContext}

${catalogContext}
${productsContext}

CUSTOMER CONTEXT:
- Customer Name: ${customerName || 'Not known yet'}
- Customer Language: ${language}
- Customer Intent: ${analysis.intent}
- Message Sentiment: ${analysis.sentiment}
- Message Body: "${normalizedMessage}"
- Customer shared media: ${mediaUrl ? 'yes' : 'no'}

HUMAN-LIKE CONVERSATIONAL RULES:
1. VOICE & TONE: Speak like a helpful human store representative. Be casual, warm, polite, and enthusiastic! Never mention you are an AI, chatbot, or virtual assistant.
2. GREETINGS & NAMES:
   - If customer's name is NOT known yet, greet them warmly with friendly emojis (e.g. "Namaste! ✨" or "Hi there! 🌸") and ask for their name naturally in ${language} so we can assist them better.
   - If customer's name IS known (e.g. "Priya"), address them by name (e.g. "Hi Priya! 😊" or "Namaste Priya! 🙏").
3. SHORT & CASUAL: Keep sentences short and sweet. Do not list too much text. Maximum 2-3 sentences.
4. EMOJIS: Use warm, elegant emojis (✨, 💍, 💎, 🌸, 😊, 🙏) to make the chat feel personal and alive.
5. TICKETS / METADATA STRUCTURE: If providing specific rates, orders, or options, present them clearly. Always represent pricing in Indian Rupees using "₹" (e.g. ₹7,200). Never use dollars ($) or "INR".
6. WHAT TO ASK NEXT: End your response with a friendly, single call-to-action question (e.g., "Would you like to see some of our latest ring designs? ✨" or "Should I book a call for custom jewelry?").

${this.getIntentInstructions(analysis.intent)}${additionalInstructions}

Generate the response in ${language} now. You MUST generate the response completely in the customer's selected language: ${language} (which corresponds to: 'en' for English, 'hi' for Hindi, 'ta' for Tamil, 'te' for Telugu, 'mr' for Marathi, 'kn' for Kannada). Even if the customer messages you in English, you must respond to them in their selected language: ${language}. Translate any product details, prices, or greetings into ${language}. Do NOT reply in English if their language is not English.`;

      const result = await this.generateContentWithRetry(prompt, aiConfig);
      let responseText = result.response.text().trim();

      responseText = responseText
          .replace(/```[\s\S]*?```/g, '')
          .replace(/^["`*]+|["`*]+$/g, '')
          .trim();

      if (responseText.length > 350) {
        responseText = responseText.substring(0, 350).trim();
        const lastSpace = responseText.lastIndexOf(' ');
        if (lastSpace > 0) {
          responseText = responseText.substring(0, lastSpace);
        }
      }

      return {
        success: true,
        text: responseText,
        scrapedProducts,
        selectedCategory,
        mediaUrl: mediaUrl || (scrapedProducts.length > 0 ? scrapedProducts[0].imageUrl : null),
        language,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Response Generation Error:', error.message);
      return await this.getFallbackResponse(analysis, customerProfile, language, normalizedMessage, mediaUrl);
      const fallbackResponse = await this.getFallbackResponse(analysis, customerProfile, language, normalizedMessage, mediaUrl);
      if (fallbackResponse) {
        fallbackResponse.aiError = `[${(error.provider || 'AI').toUpperCase()} ERROR] ${error.message}`;
        fallbackResponse.isQuotaError = error.isQuotaError;
      }
      return fallbackResponse || {
        success: false,
        text: this.localize('general_inquiry', language),
        language,
        fallback: true,
        aiError: `[${(error.provider || 'AI').toUpperCase()} ERROR] ${error.message}`,
        isQuotaError: error.isQuotaError,
        generatedAt: new Date()
      };
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

    const courierNotification = this.extractCourierNotification(normalizedMessage);
    if (courierNotification) {
      return {
        success: true,
        text: this.buildCourierNotificationResponse(courierNotification, language, config),
        language,
        courierNotification,
        fallback: true,
        generatedAt: new Date()
      };
    }

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
    const asksCollectionsGen = ['collection', 'collections', 'design', 'designs', 'piece', 'pieces', 'what do you have', 'items', 'variety', 'varieties', 'show me something', 'looking for jewelry', 'looking for jewellery', 'jewelry dikhao', 'jewellery dikhao', 'dikhao', 'i need help', 'venum', 'chahiye', 'kavali', 'beku', 'kattunga', 'dekhna hai'].some(kw => lowerMsg.includes(kw));
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

    if (['gift wrapping', 'gift wrap', 'personalised note', 'personalized note', 'send with a note'].some(kw => lower.includes(kw))) {
      return this.localize('gift_service_info', language, { phone: config.contactPhone || '+91 9345578103' });
    }

    // Gift Vouchers Check
    if (['gift voucher', 'gift card', 'vouchers', 'गिफ्ट वाउचर', 'பரிசு அட்டை', 'గిఫ్ట్ కార్డ్', 'ಗಿಫ್ಟ್ ಕಾರ್ಡ್'].some(kw => lower.includes(kw))) {
      return this.localize('faq_vouchers', language);
    }

    const hasVagueBudget = ['affordable', 'cheap', 'not too expensive', 'low budget'].some(kw => lower.includes(kw));
    const hasPremiumBudget = ['premium', 'luxury', 'high end', 'heavy'].some(kw => lower.includes(kw));
    if (hasVagueBudget || hasPremiumBudget) {
      return this.localize('vague_budget_prompt', language);
    }

    // Showroom / Store Visit Check
    if (['showroom', 'shop visit', 'visit shop', 'physical store', 'offline store', 'दुकान', 'शोरूम', 'கடை', 'దుకాణం', 'ಸ್ಟೋರ್', 'स्टोअर'].some(kw => lower.includes(kw))) {
      return this.localize('faq_showroom', language);
    }

    // Online Shopping Check
    if (['online shopping', 'buy online', 'secure', 'safe to buy', 'ऑनलाइन', 'ஆன்லைன்', 'ఆన్‌లైన్', 'ಆನ್‌ಲೈನ್', 'ऑनलाईन'].some(kw => lower.includes(kw)) && !lower.includes('order online')) {
      return this.localize('faq_online_shopping', language);
    }

    // Shipping within India Check
    if (['ship in india', 'delivery in india', 'all over india', 'shipping to', 'deliver to', 'भारत में डिलीवरी', 'இந்தியா முழுவதும்', 'భారతదేశం'].some(kw => lower.includes(kw))) {
      return this.localize('faq_shipping_india', language);
    }

    // International Shipping Check
    if (['international', 'abroad', 'usa', 'uk', 'dubai', 'uae', 'canada', 'out of india', 'विदेश', 'வெளிநாடு', 'విదేశాలకు', 'ವಿದೇಶ'].some(kw => lower.includes(kw))) {
      return this.localize('faq_shipping_intl', language);
    }

    // Certification and Hallmark Check
    if (['certificate', 'certified', 'hallmark', 'bis', 'igi', 'gia', 'purity', 'authentic', 'गारंटी', 'हॉलमार्क', 'சான்றிதழ்', 'సర్టిఫికేట్', 'ಪ್ರಮಾಣಪತ್ರ', 'प्रमाणपत्र'].some(kw => lower.includes(kw))) {
      return this.localize('faq_certification', language);
    }

    // Invoice and GST Check
    if (['gst', 'tax', 'invoice', 'bill', 'पक्का बिल', 'रसीद', 'ரசீது', 'బిల్లు', 'ರಶೀದಿ', 'पावती'].some(kw => lower.includes(kw))) {
      return this.localize('faq_invoice_gst', language);
    }

    // Video Shopping / Call Check
    if (['video call', 'video shopping', 'virtual', 'video dikhao', 'वीडियो कॉल', 'வீடியோ', 'వీడియో', 'ವೀಡಿಯೊ', 'व्हिडिओ'].some(kw => lower.includes(kw))) {
      return this.localize('faq_video_shopping', language);
    }

    // Gold Schemes and Investment Check
    if (['scheme', 'investment', 'savings', 'monthly plan', 'saving plan', 'स्कीम', 'योजना', 'திட்டம்', 'పథకం', 'ಯೋಜನೆ'].some(kw => lower.includes(kw))) {
      return this.localize('faq_gold_schemes', language);
    }

    // Lab Grown Diamonds Check
    if (['lab grown', 'lab diamond', 'cvd', 'cvd diamond', 'synthetic diamond', 'real diamond'].some(kw => lower.includes(kw)) && lower.includes('lab')) {
      return this.localize('faq_lab_grown', language);
    }

    // Product Types Check
    if (['what do you sell', 'what products', 'types of jewelry', 'what kind of', 'क्या बेचते हैं', 'என்ன விற்கிறீர்கள்', 'ఏం విక్రయిస్తారు', 'ಏನು ಮಾರುತ್ತೀರಿ'].some(kw => lower.includes(kw))) {
      return this.localize('faq_products', language);
    }

    // Support Check & More Information
    if (['more information', 'get more info', 'more details', 'need more details', 'customer care', 'customer support', 'contact support', 'how to contact', 'help line', 'helpline', 'कस्टमर केयर', 'வாடிக்கையாளர் சேவை', 'కస్టమర్ కేర్', 'ಗ್ರಾಹಕ ಸೇವೆ'].some(kw => lower.includes(kw))) {
      return this.localize('faq_support', language, { phone: config.contactPhone || '+91 9345578103' });
    }

    // How to Order Check
    if (['how to order', 'how can i order', 'how i can order', 'order process', 'want to order', 'place order', 'place an order', 'ऑर्डर कैसे करें', 'ஆர்டர் செய்வது எப்படி', 'ఎలా ఆర్డర్ చేయాలి', 'ಹೇಗೆ ಆರ್ಡರ್ ಮಾಡುವುದು'].some(kw => lower.includes(kw))) {
      return this.localize('purchase_intent', language);
    }

    // Reservation Check
    if (['reserve', 'hold item', 'keep it for me', 'बुक करके', 'முன்பதிவு', 'రిజర్వ్'].some(kw => lower.includes(kw)) && !lower.includes('reserve bank')) {
      return this.localize('faq_reserve', language);
    }

    // 22K Meaning Check
    if (['what is 22k', 'meaning of 22k', '22 carat means', '916 means', '22k का मतलब', '22k gold means', '22k pure'].some(kw => lower.includes(kw))) {
      return this.localize('faq_22k_meaning', language);
    }

    // 18K Meaning Check
    if (['what is 18k', 'meaning of 18k', '18 carat means', '18k का मतलब', '18k gold means', '18k pure'].some(kw => lower.includes(kw))) {
      return this.localize('faq_18k_meaning', language);
    }

    // 4Cs Check
    if (['4cs', '4 c', 'four c', 'four cs', 'cut color clarity', 'cut colour clarity'].some(kw => lower.includes(kw))) {
      return this.localize('faq_4cs', language);
    }

    // Solitaire Check
    if (['solitaire', 'single diamond', 'सॉलिटेयर', 'சாலிடைர்', 'సాలిటైర్'].some(kw => lower.includes(kw))) {
      return this.localize('faq_solitaire', language);
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

    const Customer = mongoose.model('Customer');
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
    // Custom Response Rules Check (Admins define custom layouts, FAQ, or flows)
    const ruleMatch = await this.checkCustomResponseRules(messageBody, customerProfile, analysis);
    if (ruleMatch) {
      return ruleMatch;
    }

    const lang = customerProfile.language || 'en';
    const customizationState = customerProfile.customFields?.customizationState || null;

    const courierNotification = this.extractCourierNotification(messageBody);
    if (courierNotification) {
      return {
        success: true,
        text: this.buildCourierNotificationResponse(courierNotification, lang, config),
        language: lang,
        courierNotification,
        generatedAt: new Date()
      };
    }

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
        $inc: { usageCount: 1 },
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

    const isDigit = /^\d+$/.test(lowerMsg);
    const hasActiveCatalog = !!(catalogState && catalogState.menuLevel);
    const selectedCategoryFromMessage = (!hasActiveCatalog || !isDigit)
      ? await this.detectCategorySelection(messageBody, config?.websiteUrl)
      : null;
    const asksToBrowseCategory = selectedCategoryFromMessage && !lowerMsg.includes('ring size') && [
      'show',
      'show me',
      'items',
      'design',
      'designs',
      'collection',
      'collections',
      'browse',
      'see',
      'view',
      'some',
      'available',
      'options'
    ].some(kw => lowerMsg.includes(kw));

    if (asksToBrowseCategory) {
      return await this.handleCategoryCatalogResponse(selectedCategoryFromMessage, customerProfile.userId, config, lang, customerProfile, null, messageBody);
    }

    const earlyGuideResponse = this.getGuideDirectResponse(messageBody, config, lang);
    const isExplicitGuideQuestion = (
      lowerMsg.includes('ring size') ||
      lowerMsg.includes('find my ring size') ||
      lowerMsg.includes("don't know my size") ||
      ['who are you', 'are you a robot', 'what are you'].some(kw => lowerMsg.includes(kw)) ||
      lowerMsg.includes('joke') ||
      ['where are you', 'located', 'location', 'address', 'open today', 'opening time', 'store hours', 'visiting hours'].some(kw => lowerMsg.includes(kw)) ||
      ['22k or 24k', '22k vs 24k', 'gold vs silver', 'which is better', 'genuine gold', 'real gold'].some(kw => lowerMsg.includes(kw)) ||
      ['more information', 'get more info', 'more details', 'need more details', 'customer care', 'customer support', 'contact support', 'how to contact', 'help line', 'helpline'].some(kw => lowerMsg.includes(kw)) ||
      ['how to order', 'how can i order', 'how i can order', 'order process', 'want to order', 'place order', 'place an order'].some(kw => lowerMsg.includes(kw))
    );
    if (earlyGuideResponse && isExplicitGuideQuestion) {
      // If the response is purchase_intent, and we are not in PRODUCT_DETAIL, clear state to avoid option clash
      if (earlyGuideResponse === this.localize('purchase_intent', lang) && catalogState?.menuLevel !== 'PRODUCT_DETAIL') {
        await Customer.findByIdAndUpdate(customerProfile._id, {
          'customFields.catalogState': null
        });
        if (customerProfile.customFields) {
          customerProfile.customFields.catalogState = null;
        }
        catalogState = null;
      }

      return {
        success: true,
        text: earlyGuideResponse,
        language: lang,
        generatedAt: new Date()
      };
    }

    // 2. Direct Category Selection Check (bypasses intent-based template routing)
    if (!hasActiveCatalog || !isDigit) {
      const selectedCategory = selectedCategoryFromMessage;
      if (selectedCategory) {
        return await this.handleCategoryCatalogResponse(selectedCategory, customerProfile.userId, config, lang, customerProfile, null, messageBody);
      }
    }

    // 3. Intercept catalog entry triggers
    const asksCatalogDirect = ['catalog', 'catalogue', 'menu', 'card', 'pdf', 'brochure', 'link'].some(kw => lowerMsg.includes(kw));
    const asksCollectionsGen = ['collection', 'collections', 'design', 'designs', 'piece', 'pieces', 'what do you have', 'items', 'variety', 'varieties', 'show me something', 'looking for jewelry', 'looking for jewellery', 'jewelry dikhao', 'jewellery dikhao', 'dikhao', 'i need help', 'venum', 'chahiye', 'kavali', 'beku', 'kattunga', 'dekhna hai'].some(kw => lowerMsg.includes(kw));

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
            return await this.handleCategoryCatalogResponse('GIFTS', customerProfile.userId, config, lang, customerProfile, 'GIFTS', messageBody);
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
          return await this.handleCategoryCatalogResponse(sub, customerProfile.userId, config, lang, customerProfile, catalogState.gender, messageBody);
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
          const scrapedProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', catalogState.gender, catalogState.subcategory);
          const rawProducts = scrapedProducts.length > 0 ? scrapedProducts : (catalogState.products || []);
          
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

          if (filtered.length === 0) {
            const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
            const path = await this.getDynamicCategoryPath(catalogState.gender, catalogState.subcategory, config.websiteUrl);
            const categoryUrl = `${base}${path}`;
            return {
              success: true,
              text: `${customHeader || this.localize('budget_empty', lang, { category: (catalogState.subcategory || 'products').toLowerCase(), maxPrice: priceFilter.maxPrice || '', minAvailablePrice: 'a higher budget' })}\n\nYou can still browse the full collection here:\n${categoryUrl}`,
              scrapedProducts: [],
              selectedCategory: catalogState.subcategory,
              language: lang,
              generatedAt: new Date()
            };
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
            const scrapedProducts = await this.scrapeProductsFromUrl(config.websiteUrl || 'https://kanalli.in/', catalogState.gender, catalogState.subcategory);
            const rawProducts = scrapedProducts.length > 0 ? scrapedProducts : (catalogState.products || []);
            
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

            if (filtered.length === 0) {
              const base = (config.websiteUrl || 'https://kanalli.in/').endsWith('/') ? config.websiteUrl : `${config.websiteUrl}/`;
              const path = await this.getDynamicCategoryPath(catalogState.gender, catalogState.subcategory, config.websiteUrl);
              const categoryUrl = `${base}${path}`;
              return {
                success: true,
                text: `${customHeader || this.localize('budget_empty', lang, { category: (catalogState.subcategory || 'products').toLowerCase(), maxPrice: priceFilter.maxPrice || '', minAvailablePrice: 'a higher budget' })}\n\nYou can still browse the full collection here:\n${categoryUrl}`,
                scrapedProducts: [],
                selectedCategory: catalogState.subcategory,
                language: lang,
                generatedAt: new Date()
              };
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
      
      if (priceFilter.minPrice !== null) query.price = { $gte: priceFilter.minPrice };
      if (priceFilter.maxPrice !== null) query.price = { ...query.price, $lte: priceFilter.maxPrice };

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

      // Acknowledge the budget and ask for the category globally if no products match
      const isJustBudget = !await this.detectCategorySelection(messageBody, config?.websiteUrl);
      if (isJustBudget) {
        let budgetMsg = '';
        if (priceFilter.minPrice !== null && priceFilter.maxPrice !== null) {
          budgetMsg = this.localize('budget_set_range', lang, { minPrice: priceFilter.minPrice, maxPrice: priceFilter.maxPrice });
        } else if (priceFilter.maxPrice !== null) {
          budgetMsg = this.localize('budget_set', lang, { maxPrice: priceFilter.maxPrice });
        } else if (priceFilter.minPrice !== null) {
          budgetMsg = this.localize('budget_set_above', lang, { minPrice: priceFilter.minPrice });
        }
        
        if (budgetMsg) {
          const newState = {
            menuLevel: 'AWAITING_CATEGORY',
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
            text: budgetMsg + '\n\n' + this.localize('catalog_prompt', lang),
            mediaUrl: config.catalogImageUrl || 'https://kanalli.in/wp-content/uploads/2026/05/KANALLI_logo_4K_black_trans01.png',
            language: lang,
            generatedAt: new Date()
          };
        }
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
        if (catUpper === 'SHOW_MORE') {
          path = await this.getDynamicShopUrl(config.websiteUrl);
        } else {
          path = await this.getDynamicCategoryPath('WOMEN', selectedCategory, config.websiteUrl);
        }
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
            $inc: { usageCount: 1 },
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

    // 5. Catch Spelling Mistakes / Typos before falling back
    const typo = this.getTypoSuggestion(lowerMsg);
    if (typo && !hasAdminKeyword) {
      const displayWord = typo.word.charAt(0).toUpperCase() + typo.word.slice(1);
      
      const newState = {
        menuLevel: 'TYPO_CORRECTION',
        suggestedCategory: typo.category,
        suggestedWord: displayWord,
        originalWord: messageBody.trim()
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
        text: this.localize('typo_prompt', lang, { original: messageBody.trim(), suggestion: displayWord }),
        language: lang,
        generatedAt: new Date()
      };
    }

    return null;
  }

  async checkCustomResponseRules(messageBody, customerProfile, analysis) {
    try {
      const ResponseRule = mongoose.model('ResponseRule');
      const lowerMsg = (messageBody || '').toLowerCase().trim();
      
      // Also get the last incoming message content to match by button/list label text if clicked
      const MessageModel = mongoose.model('Message');
      const lastIncoming = await MessageModel.findOne({
        customerId: customerProfile._id,
        userId: customerProfile.userId,
        tags: 'incoming'
      }).sort({ createdAt: -1 }).lean();
      const lowerIncomingText = lastIncoming ? (lastIncoming.content || '').toLowerCase().trim() : '';

      const config = await this.getShopConfig(customerProfile.userId);
      const aiConfig = {
        provider: config.provider || 'gemini',
        apiKey: config.geminiApiKey || process.env.GEMINI_API_KEY,
        model: config.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      };

      // Find all active rules for the user
      const rules = await ResponseRule.find({ userId: customerProfile.userId, isActive: true }).lean();
      if (!rules || rules.length === 0) return null;

      let matchedRule = null;

      // 1. Exact Match Check
      for (const rule of rules) {
        if (rule.triggerType === 'EXACT_MATCH') {
          const valClean = rule.triggerValue.toLowerCase().trim();
          if (lowerMsg === valClean || (lowerIncomingText && lowerIncomingText === valClean)) {
            matchedRule = rule;
            break;
          }
        }
      }

      // 2. Keyword Includes Check
      if (!matchedRule) {
        for (const rule of rules) {
          if (rule.triggerType === 'KEYWORD') {
            const keywords = rule.triggerValue.split(',').map(k => k.trim().toLowerCase());
            const matched = keywords.some(k => k && (
              lowerMsg === k || 
              lowerMsg.includes(k) || 
              (lowerIncomingText && (lowerIncomingText === k || lowerIncomingText.includes(k)))
            ));
            if (matched) {
              matchedRule = rule;
              break;
            }
          }
        }
      }

      // 3. Intent Classification Check
      if (!matchedRule && analysis && analysis.intent) {
        const intentClean = analysis.intent.toLowerCase().trim();
        for (const rule of rules) {
          if (rule.triggerType === 'INTENT') {
            const valClean = rule.triggerValue.toLowerCase().trim();
            if (intentClean === valClean) {
              matchedRule = rule;
              break;
            }
          }
        }
      }

      if (matchedRule) {
        console.log(`[ResponseRules] Message matched rule: "${matchedRule.name}" (${matchedRule._id})`);

        const aiSmartFeatures = require('./aiSmartFeatures');
        let responseText = '';
        let mediaUrlToSend = null;
        let buttonsToSend = [];
        let listToSend = null;
        let relatedQuestionsToSend = [];
        const lang = customerProfile.language || 'en';

        for (const block of matchedRule.messageBlocks) {
          if (block.type === 'TEXT') {
            const blockText = block.config?.text || '';
            let personalized = await aiSmartFeatures.personalizeMessage(blockText, customerProfile);
            personalized = await this.translateText(personalized, lang, aiConfig);
            responseText += (responseText ? '\n\n' : '') + personalized;
          } else if (block.type === 'CARD') {
            const title = block.config?.title || '';
            const desc = block.config?.description || '';
            const img = block.config?.imageUrl || '';
            
            let personalizedTitle = title ? await aiSmartFeatures.personalizeMessage(title, customerProfile) : '';
            let personalizedDesc = desc ? await aiSmartFeatures.personalizeMessage(desc, customerProfile) : '';

            if (personalizedTitle) personalizedTitle = await this.translateText(personalizedTitle, lang, aiConfig);
            if (personalizedDesc) personalizedDesc = await this.translateText(personalizedDesc, lang, aiConfig);

            let cardText = '';
            if (personalizedTitle) cardText += `*${personalizedTitle}*\n`;
            if (personalizedDesc) cardText += personalizedDesc;

            responseText += (responseText ? '\n\n' : '') + cardText;
            if (img) mediaUrlToSend = img;

            // Card buttons support
            if (block.config?.buttons && Array.isArray(block.config.buttons)) {
              for (const b of block.config.buttons) {
                let label = b.label || '';
                label = await aiSmartFeatures.personalizeMessage(label, customerProfile);
                label = await this.translateText(label, lang, aiConfig);
                buttonsToSend.push({
                  label,
                  value: b.actionValue || b.value || '',
                  type: b.type || 'QUICK_REPLY'
                });
              }
            }
          } else if (block.type === 'BUTTONS') {
            const btns = block.config?.buttons || [];
            for (const b of btns) {
              let label = b.label || '';
              label = await aiSmartFeatures.personalizeMessage(label, customerProfile);
              label = await this.translateText(label, lang, aiConfig);
              buttonsToSend.push({
                label,
                value: b.value || b.actionValue || '',
                type: b.type || 'QUICK_REPLY'
              });
            }
          } else if (block.type === 'LIST') {
            const listTitle = block.config?.title || 'Select Option';
            const buttonText = block.config?.buttonText || 'View Options';
            const sections = block.config?.sections || [];

            let personalizedListTitle = await aiSmartFeatures.personalizeMessage(listTitle, customerProfile);
            let personalizedBtnText = await aiSmartFeatures.personalizeMessage(buttonText, customerProfile);

            personalizedListTitle = await this.translateText(personalizedListTitle, lang, aiConfig);
            personalizedBtnText = await this.translateText(personalizedBtnText, lang, aiConfig);

            const translatedSections = [];
            for (const sec of sections) {
              let secTitle = sec.title || '';
              if (secTitle) {
                secTitle = await aiSmartFeatures.personalizeMessage(secTitle, customerProfile);
                secTitle = await this.translateText(secTitle, lang, aiConfig);
              }

              const translatedRows = [];
              for (const row of (sec.rows || [])) {
                let rTitle = row.title || '';
                let rDesc = row.description || '';

                rTitle = await aiSmartFeatures.personalizeMessage(rTitle, customerProfile);
                rDesc = await aiSmartFeatures.personalizeMessage(rDesc, customerProfile);

                rTitle = await this.translateText(rTitle, lang, aiConfig);
                rDesc = await this.translateText(rDesc, lang, aiConfig);

                translatedRows.push({
                  id: row.rowId,
                  title: rTitle,
                  description: rDesc
                });
              }

              translatedSections.push({
                title: secTitle,
                rows: translatedRows
              });
            }

            listToSend = {
              title: personalizedListTitle,
              buttonText: personalizedBtnText,
              sections: translatedSections
            };
          } else if (block.type === 'RELATED_QUESTIONS') {
            const qns = block.config?.questions || [];
            for (const q of qns) {
              let personalizedQ = await aiSmartFeatures.personalizeMessage(q, customerProfile);
              personalizedQ = await this.translateText(personalizedQ, lang, aiConfig);
              relatedQuestionsToSend.push(personalizedQ);
            }
          }
        }

        if (!responseText) {
          if (buttonsToSend.length > 0) {
            responseText = 'Please choose one of the options below.';
          } else if (listToSend) {
            responseText = 'Please select one of the options below.';
          }
        }

        if (matchedRule.actionType === 'HUMAN_HANDOVER') {
          const Customer = mongoose.model('Customer');
          const Conversation = mongoose.model('Conversation');
          
          await Customer.findByIdAndUpdate(customerProfile._id, {
            'customFields.autopilotPaused': true
          });
          
          const conv = await Conversation.findOne({ customerId: customerProfile._id, userId: customerProfile.userId, status: 'ACTIVE' });
          if (conv) {
            conv.autoReplyEnabled = false;
            conv.status = 'WAITING_FOR_TEAM';
            conv.priority = 'HIGH';
            if (!conv.tags.includes('escalated')) {
              conv.tags.push('escalated');
            }
            await conv.save();
          }
          
          if (!responseText) {
            responseText = "I'm passing you over to a human assistant who will assist you shortly. 🙏";
            responseText = await this.translateText(responseText, lang, aiConfig);
          }
        }

        if (relatedQuestionsToSend.length > 0) {
          responseText += '\n\n*Related Questions:*';
          relatedQuestionsToSend.forEach(q => {
            responseText += `\n👉 ${q}`;
          });
        }

        return {
          success: true,
          text: responseText,
          mediaUrl: mediaUrlToSend || null,
          buttons: buttonsToSend.length > 0 ? buttonsToSend : null,
          list: listToSend,
          relatedQuestions: relatedQuestionsToSend.length > 0 ? relatedQuestionsToSend : null,
          escalated: matchedRule.actionType === 'HUMAN_HANDOVER',
          language: lang,
          generatedAt: new Date()
        };
      }

      return null;
    } catch (err) {
      console.error('[ResponseRules] Error checking rules:', err.message);
      return null;
    }
  }

  async translateText(text, targetLanguage, aiConfig) {
    try {
      if (!targetLanguage || !text || !text.trim()) return text;
      
      const sourceLang = this.detectLanguage(text);
      if (sourceLang === targetLanguage) {
        return text;
      }
      
      if (!aiConfig.apiKey) return text;

      const genAI = new GoogleGenerativeAI(aiConfig.apiKey);
      const model = genAI.getGenerativeModel({ model: aiConfig.model });

      const prompt = `You are a professional translator. Translate the following chatbot message directly to the target language code "${targetLanguage}".
Target Language mappings: en=English, hi=Hindi, ta=Tamil, te=Telugu, mr=Marathi, kn=Kannada.

CRITICAL INSTRUCTIONS:
1. If the text is already in the target language (${targetLanguage}), return it exactly as is without any changes.
2. Maintain the exact emojis, formatting, and personalization placeholders (like {{firstName}} or {{productName}}).
3. Do not translate the placeholders inside brackets (keep them exactly as {{firstName}}, {{productName}}, etc.).
4. Return ONLY the translated text. Do not add explanations or quotes.

Text to translate:
"${text}"`;

      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err) {
      console.warn(`[Translation] Failed to translate to ${targetLanguage}:`, err.message);
      return text;
    }
  }

  async getOptimizedRAGContext(messageText, userId) {
    try {
      if (!messageText || !messageText.trim()) return '';

      const KnowledgeDocument = mongoose.model('KnowledgeDocument');

      const words = messageText
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);

      if (words.length === 0) return '';

      const keywordRegexes = words.map(w => new RegExp(w, 'i'));

      const docs = await KnowledgeDocument.find({
        userId,
        status: 'ACTIVE',
        $or: keywordRegexes.map(regex => ({ content: regex }))
      }).limit(3).lean();

      if (!docs || docs.length === 0) return '';

      console.log(`[KnowledgeBase] RAG matched ${docs.length} documents for query keywords: [${words.join(', ')}]`);

      return '\n\nADDITIONAL UPLOADED KNOWLEDGE DOCUMENTS (FAQs & POLICIES):\n' + docs.map(d => 
        `[Document: ${d.fileName}]\n${d.content}`
      ).join('\n---\n');
    } catch (err) {
      console.warn('[KnowledgeBase] Optimized RAG failed:', err.message);
      return '';
    }
  }
}

module.exports = new AIMessageAnalyzer();

