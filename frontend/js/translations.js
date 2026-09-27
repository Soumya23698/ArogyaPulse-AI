/**
 * translations.js
 * Comprehensive Multilingual Localization for ArogyaPulse AI
 * Languages: English (en), हिन्दी (hi), বাংলা (bn), தமிழ் (ta), తెలుగు (te), मराठी (mr)
 */

const TRANSLATIONS = {
  en: {
    app_title: "ArogyaPulse AI",
    app_subtitle: "National Federated Health Resource & Supply Chain Intelligence Grid",
    tagline: "Ministry of Health & Family Welfare | National Health Mission",
    nav_overview: "National Grid Overview",
    nav_forecasting: "Demand Forecasting & Warnings",
    nav_redistribution: "Cross-District Redistribution",
    nav_federated: "Federated Learning Grid",
    nav_copilot: "Sanjeevani AI Copilot",
    nav_stock_entry: "Frontline Voice & Vision Entry",
    
    status_live: "National Telemetry: LIVE",
    status_abdm: "ABDM & DISHA Compliant",
    emergency_active: "Active Outbreak Emergency",
    no_emergency: "Normal Surveillance Status",
    
    kpi_phcs: "PHC Network Monitored",
    kpi_beds: "Total Bed Occupancy",
    kpi_staff: "Healthcare Personnel on Duty",
    kpi_critical: "Critical Medicine Shortages",
    kpi_oxygen: "Oxygen Supported Beds",
    kpi_icu: "ICU Ventilators Available",
    
    filter_all_states: "All India (36 States & UTs)",
    filter_all_types: "All Facilities (PHC, CHC, DH)",
    search_placeholder: "Search PHC by name, district, or PIN code...",
    
    btn_simulate_outbreak: "Simulate Outbreak",
    btn_reset_baseline: "Reset Baseline",
    btn_run_federated: "Run Federated Round",
    btn_execute_all: "Approve All Dispatches",
    btn_voice_input: "Voice Command",
    btn_settings: "Google AI Settings",
    btn_scan_register: "Analyze Photo with Gemini Vision",
    btn_back_overview: "← Back to National Grid Overview",
    btn_back_prev: "← Back",
    
    outbreak_dengue: "Dengue & Thrombocytopenia Spike",
    outbreak_flood: "Monsoon Flood Waterborne Gastro Surge",
    outbreak_snakebite: "Agricultural Harvest Snakebite Cluster",
    
    txt_days_runway: "Days Runway Remaining",
    txt_stockout_date: "Projected Stockout Date",
    txt_confidence: "95% Prediction Confidence Band",
    txt_donor_hub: "Surplus Donor Hub",
    txt_receiver: "Deficit Health Facility",
    txt_distance: "Transit Distance & Speed",
    txt_cold_chain: "Cold-Chain Protocol Required (2°C - 8°C)",
    txt_ambient: "Standard Ambient Transport",
    txt_rationale: "AI Allocation Rationale",
    txt_gate_pass: "Digital Dispatch Gate Pass",
    
    fed_title: "Federated Learning across India's States (FedAvg)",
    fed_desc: "State edge nodes train locally on Primary Health Centre telemetry without transmitting citizen health records or PHI to a central cloud server. Differential Privacy (ε=1.25) protects citizen privacy under ABDM/DISHA.",
    fed_accuracy: "Global Model Accuracy",
    fed_loss: "Global Test Loss",
    fed_records_protected: "Raw Patient Records Protected",
    fed_gradient_size: "Model Gradient Size Transferred"
  },
  
  hi: {
    app_title: "आरोग्य पल्स एआई (ArogyaPulse AI)",
    app_subtitle: "राष्ट्रीय संवहनीय स्वास्थ्य रसद एवं आपूर्ति श्रृंखला बुद्धिमत्ता ग्रिड",
    tagline: "स्वास्थ्य एवं परिवार कल्याण मंत्रालय | राष्ट्रीय स्वास्थ्य मिशन",
    nav_overview: "राष्ट्रीय स्वास्थ्य ग्रिड अवलोकन",
    nav_forecasting: "मांग पूर्वानुमान एवं चेतावनी",
    nav_redistribution: "अंतर-जिला स्वचालित पुनर्वितरण",
    nav_federated: "फेडरेटेड लर्निंग एवं राज्य नोड्स",
    nav_copilot: "संजीवनी एआई सहायक",
    nav_stock_entry: "फ्रंटलाइन वॉइस एवं विज़न प्रविष्टि",
    
    status_live: "राष्ट्रीय टेलीमेट्री: सक्रिय (LIVE)",
    status_abdm: "आयुष्मान भारत (ABDM) व DISHA अनुपालन",
    emergency_active: "सक्रिय आपातकालीन प्रकोप",
    no_emergency: "सामान्य स्वास्थ्य निगरानी स्थिति",
    
    kpi_phcs: "निगरानी किए जा रहे पीएचसी",
    kpi_beds: "कुल बेड अधिभोग दर",
    kpi_staff: "ड्यूटी पर स्वास्थ्य कर्मी",
    kpi_critical: "गंभीर दवा स्टॉकआउट संकट",
    kpi_oxygen: "ऑक्सीजन समर्थित बेड",
    kpi_icu: "उपलब्ध आईसीयू वेंटिलेटर",
    
    filter_all_states: "संपूर्ण भारत (8 राज्य)",
    filter_all_types: "सभी सुविधाएं (पीएचसी, सीएचसी, जिला अस्पताल)",
    search_placeholder: "पीएचसी का नाम, जिला या पिन कोड खोजें...",
    
    btn_simulate_outbreak: "प्रकोप अनुकरण (Simulate)",
    btn_reset_baseline: "सामान्य स्थिति पुनर्स्थापित करें",
    btn_run_federated: "फेडरेटेड राउंड चलाएं",
    btn_execute_all: "सभी दवा प्रेषण स्वीकृत करें",
    btn_voice_input: "आवाज से बोलें",
    btn_settings: "गूगल एआई सेटिंग्स",
    btn_scan_register: "जेमिनी विजन से फोटो स्कैन करें",
    btn_back_overview: "← वापस राष्ट्रीय ग्रिड अवलोकन पर जाएं",
    btn_back_prev: "← पीछे जाएं",
    
    outbreak_dengue: "डेंगू एवं प्लेटलेट संकट प्रकोप",
    outbreak_flood: "बाढ़ जलजनित अतिसार (गैस्ट्रो) प्रकोप",
    outbreak_snakebite: "ग्रामीण कृषि सर्पदंश संकट",
    
    txt_days_runway: "शेष सुरक्षित दिन (रनवे)",
    txt_stockout_date: "अनुमानित स्टॉक समाप्ति तिथि",
    txt_confidence: "95% भविष्यवाणी विश्वसनीयता स्तर",
    txt_donor_hub: "अधिशेष आपूर्तिकर्ता हब",
    txt_receiver: "कमी वाला प्राथमिक स्वास्थ्य केंद्र",
    txt_distance: "परिवहन दूरी एवं अनुमानित समय",
    txt_cold_chain: "कोल्ड-चेन प्रोटोकॉल अनिवार्य (2°C - 8°C)",
    txt_ambient: "मानक परिवेशी परिवहन",
    txt_rationale: "एआई आवंटन तर्क एवं व्याख्या",
    txt_gate_pass: "डिजिटल डिस्पैच गेट पास",
    
    fed_title: "भारतीय राज्यों में फेडरेटेड लर्निंग (FedAvg)",
    fed_desc: "राज्य के नोड्स नागरिकों के गोपनीय स्वास्थ्य रिकॉर्ड को केंद्रीय सर्वर पर भेजे बिना स्थानीय रूप से मॉडल को प्रशिक्षित करते हैं। डिफरेंशियल प्राइवेसी (ε=1.25) आयुष्मान भारत एवं DISHA के तहत गोपनीयता सुनिश्चित करती है।",
    fed_accuracy: "वैश्विक मॉडल सटीकता",
    fed_loss: "वैश्विक परीक्षण त्रुटि (Loss)",
    fed_records_protected: "सुरक्षित रखे गए नागरिक रिकॉर्ड",
    fed_gradient_size: "हस्तांतरित मॉडल ग्रेडिएंट पेलोड"
  },

  bn: {
    app_title: "আরোগ্য পাল্স এআই (ArogyaPulse AI)",
    app_subtitle: "জাতীয় স্বাস্থ্য সরবরাহ শৃঙ্খলা ও সম্পদ ব্যবস্থাপনা গ্রিড",
    tagline: "স্বাস্থ্য ও পরিবার কল্যাণ মন্ত্রক | জাতীয় স্বাস্থ্য মিশন",
    nav_overview: "জাতীয় গ্রিড পরিদর্শন",
    nav_forecasting: "চাহিদা পূর্বাভাস ও সতর্কতা",
    nav_redistribution: "আন্তঃজেলা স্বয়ংক্রিয় বণ্টন",
    nav_federated: "ফেডারেটেড লার্নিং গ্রিড",
    nav_copilot: "সঞ্জীবনী এআই সহকারী",
    nav_stock_entry: "ভয়েস ও ভিশন স্টক এন্ট্রি",
    
    status_live: "জাতীয় টেলিমেট্রি: সক্রিয় (LIVE)",
    status_abdm: "আয়ুষ্মান ভারত ও DISHA নীতি অনুযায়ী সুরক্ষিত",
    emergency_active: "সক্রিয় স্বাস্থ্য জরুরি অবস্থা",
    no_emergency: "স্বাভাবিক নজরদারি স্থিতি",
    
    kpi_phcs: "নজরদারি করা স্বাস্থ্য কেন্দ্র",
    kpi_beds: "মোট বেড অকুপেন্সি",
    kpi_staff: "উপস্থিত স্বাস্থ্যকর্মী",
    kpi_critical: "জরুরি ওষুধ ঘাটতি",
    kpi_oxygen: "অক্সিজেন বেড প্রাপ্যতা",
    kpi_icu: "আইসিইউ ভেন্টিলেটর উপলব্ধ",
    
    filter_all_states: "সমগ্র ভারত (৩৬টি রাজ্য ও কেন্দ্রশাসিত অঞ্চল)",
    btn_simulate_outbreak: "জরুরি মহামারী সিমুলেশন",
    btn_reset_baseline: "স্বাভাবিক অবস্থায় ফিরুন",
    btn_run_federated: "ফেডারেটেড রাউন্ড চালান",
    btn_execute_all: "সকল ওষুধ প্রেরণ অনুমোদন করুন",
    btn_voice_input: "ভয়েস ইনপুট",
    btn_settings: "গুগল এআই সেটিংস",
    btn_scan_register: "ফটোর তথ্য বিশ্লেষণ করুন",
    btn_back_overview: "← জাতীয় গ্রিড পরিদর্শনে ফিরে যান",
    btn_back_prev: "← ফিরে যান",
    
    outbreak_dengue: "ডেঙ্গু ও প্লেটলেট ঘাটতি প্রাদুর্ভাব",
    outbreak_flood: "বন্যার পর ডায়রিয়া ও গ্যাস্ট্রো প্রাদুর্ভাব",
    outbreak_snakebite: "কৃষি মৌসুমে সর্পদংশন বৃদ্ধি",
    
    txt_days_runway: "বাকি মজুত দিন (রানওয়ে)",
    txt_stockout_date: "সম্ভাব্য মজুত শেষ হওয়ার তারিখ",
    txt_confidence: "৯৫% নির্ভুলতা পূর্বাভাস",
    txt_donor_hub: "উদ্বৃত্ত দাতা হাসপাতাল",
    txt_receiver: "ঘাটতিগ্রস্ত প্রাথমিক স্বাস্থ্য কেন্দ্র",
    txt_distance: "দূরত্ব ও আনুমানিক ট্রানজিট সময়",
    txt_cold_chain: "কোল্ড-চেন প্রয়োজন (২°C - ৮°C)",
    txt_ambient: "সাধারণ পরিবহন",
    txt_rationale: "এআই যুক্তিসঙ্গত সিদ্ধান্ত",
    txt_gate_pass: "ডিজিটাল গেট পাস",
    
    fed_title: "ভারতের রাজ্যগুলির মধ্যে ফেডারেটেড লার্নিং",
    fed_desc: "নাগরিকদের ব্যক্তিগত চিকিৎসা তথ্য গোপন রেখে কেবল মডেল ওয়েট শেয়ার করার মাধ্যমে সর্বভারতীয় পূর্বাভাস ব্যবস্থা গড়ে তোলা হয়েছে।",
    fed_accuracy: "গ্লোবাল মডেল নির্ভুলতা",
    fed_loss: "গ্লোবাল টেস্ট লস",
    fed_records_protected: "সুরক্ষিত রোগীর রেকর্ড সংখ্যা",
    fed_gradient_size: "ট্রান্সফার করা গ্রেডিয়েন্ট সাইজ"
  },

  ta: {
    app_title: "ஆரோக்ய பல்ஸ் ஏஐ (ArogyaPulse AI)",
    app_subtitle: "தேசிய சுகாதார வள மற்றும் விநியோகச் சங்கிலி நுண்ணறிவு கிரிட்",
    tagline: "சுகாதார மற்றும் குடும்ப நல அமைச்சகம் | தேசிய சுகாதார இயக்கம்",
    nav_overview: "தேசிய கண்ணோட்டம்",
    nav_forecasting: "தேவை முன்னறிவிப்பு & எச்சரிக்கை",
    nav_redistribution: "மாவட்டங்களுக்கிடையேயான மறுபங்கீடு",
    nav_federated: "கூட்டு கற்றல் (Federated Learning)",
    nav_copilot: "சஞ்சீவனி ஏஐ உதவியாளர்",
    nav_stock_entry: "குரல் & பார்வை இருப்பு பதிவு",
    
    status_live: "நேரலை கண்காணிப்பு: இயங்குகிறது",
    status_abdm: "ஆயுஷ்மான் பாரத் ஒழுங்குமுறை இணக்கம்",
    emergency_active: "தீவிர தொற்றுநோய் அவசரநிலை",
    no_emergency: "இயல்பான சுகாதார நிலை",
    
    kpi_phcs: "கண்காணிக்கப்படும் ஆரம்ப சுகாதார நிலையங்கள்",
    kpi_beds: "படுக்கை பயன்பாட்டு விகிதம்",
    kpi_staff: "பணியில் உள்ள மருத்துவப் பணியாளர்கள்",
    kpi_critical: "மருந்து தட்டுப்பாடு எச்சரிக்கைகள்",
    kpi_oxygen: "ஆக்ஸிஜன் படுக்கைகள்",
    kpi_icu: "கிடைக்கும் வென்டிலேட்டர்கள்",
    
    filter_all_states: "அனைத்து இந்திய மாநிலங்கள்",
    filter_all_types: "அனைத்து வசதிகள்",
    search_placeholder: "பெயர் அல்லது மாவட்டம் மூலம் தேடவும்...",
    
    btn_simulate_outbreak: "தொற்றுநோயை உருவகப்படுத்துக",
    btn_reset_baseline: "மீட்டமை",
    btn_run_federated: "ஃபெடரேட்டட் சுற்றை இயக்கவும்",
    btn_execute_all: "அனைத்து அனுப்பல்களையும் அங்கீகரிக்கவும்",
    btn_voice_input: "குரல் கட்டளை",
    btn_settings: "கூகிள் ஏஐ அமைப்புகள்",
    btn_scan_register: "புகைப்படத்தை ஸ்கேன் செய்",
    btn_back_overview: "← தேசிய கண்ணோட்டத்திற்குத் திரும்பு",
    btn_back_prev: "← பின்செல்",
    
    outbreak_dengue: "டெங்கு தீவிர பரவல்",
    outbreak_flood: "வெள்ளம் நீர் சார்ந்த நோய் தொற்று",
    outbreak_snakebite: "விவசாய பாம்புக்கடி அவசரநிலை",
    
    txt_days_runway: "மீதமுள்ள கையிருப்பு நாட்கள்",
    txt_stockout_date: "கையிருப்பு தீரும் தேதி",
    txt_confidence: "95% கணிப்பு நம்பிக்கை",
    txt_donor_hub: "உபரி இருப்பு மையம்",
    txt_receiver: "பற்றாக்குறை சுகாதார மையம்",
    txt_distance: "போக்குவரத்து தூரம் மற்றும் நேரம்",
    txt_cold_chain: "குளிர் சங்கிலி தேவை (2°C - 8°C)",
    txt_ambient: "சாதாரண போக்குவரத்து",
    txt_rationale: "ஏஐ பகிர்வு நியாயப்படுத்தல்",
    txt_gate_pass: "டிஜிட்டல் நுழைவுச் சீட்டு",
    
    fed_title: "இந்திய மாநிலங்களுக்கிடையேயான கூட்டு கற்றல்",
    fed_desc: "மக்களின் மருத்துவ ரகசியங்களை பகிராமல் உள்ளூர் மட்டத்தில் மாதிரிகள் பயிற்சி பெறுகின்றன.",
    fed_accuracy: "உலகளாவிய துல்லியம்",
    fed_loss: "உலகளாவிய பிழை அளவு",
    fed_records_protected: "பாதுகாக்கப்பட்ட நோயாளி பதிவுகள்",
    fed_gradient_size: "பரிமாற்றப்பட்ட தரவு அளவு"
  },

  te: {
    app_title: "ఆరోగ్య పల్స్ AI (ArogyaPulse AI)",
    app_subtitle: "జాతీయ ఆరోగ్య వనరులు మరియు సరఫరా గొలుసు పర్యవేక్షణ గ్రిడ్",
    tagline: "ఆరోగ్య & కుటుంబ సంక్షేమ మంత్రిత్వ శాఖ | జాతీయ ఆరోగ్య మిషన్",
    nav_overview: "జాతీయ గ్రిడ్ అవలోకనం",
    nav_forecasting: "డిమాండ్ అంచనా & హెచ్చరికలు",
    nav_redistribution: "జిల్లాల మధ్య ఆటోమేటెడ్ పునర్విభజన",
    nav_federated: "ఫెడరేటెడ్ లెర్నింగ్ గ్రిడ్",
    nav_copilot: "సంజీవని AI సహాయకుడు",
    nav_stock_entry: "వాయిస్ & విజన్ స్టాక్ ఎంట్రీ",
    
    status_live: "లైవ్ పర్యవేక్షణ: సక్రియంగా ఉంది",
    status_abdm: "ఆయుష్మాన్ భారత్ & DISHA నిబంధనలకు అనుగుణంగా",
    emergency_active: "తీవ్రమైన వ్యాధి వ్యాప్తి అత్యవసర పరిస్థితి",
    no_emergency: "సాధారణ పర్యవేక్షణ స్థితి",
    
    kpi_phcs: "పర్యవేక్షించబడుతున్న ప్రాథమిక ఆరోగ్య కేంద్రాలు",
    kpi_beds: "మొత్తం బెడ్ల వినియోగ రేటు",
    kpi_staff: "విధుల్లో ఉన్న వైద్య సిబ్బంది",
    kpi_critical: "క్లిష్టమైన మందుల కొరత",
    kpi_oxygen: "ఆక్సిజన్ బెడ్ల లభ్యత",
    kpi_icu: "అందుబాటులో ఉన్న వెంటిలేటర్లు",
    
    filter_all_states: "భారతదేశం అంతటా",
    filter_all_types: "అన్ని కేంద్రాలు",
    search_placeholder: "కేంద్రం పేరు, జిల్లా ద్వారా శోధించండి...",
    
    btn_simulate_outbreak: "వ్యాధి వ్యాప్తిని అనుకరించండి",
    btn_reset_baseline: "పునరుద్ధరించండి",
    btn_run_federated: "ఫెడరేటెడ్ రౌండ్ రన్ చేయండి",
    btn_execute_all: "అన్ని పంపకాలను ఆమోదించండి",
    btn_voice_input: "వాయిస్ కమాండ్",
    btn_settings: "గూగుల్ AI సెట్టింగ్‌లు",
    btn_scan_register: "ఫోటోను స్కాన్ చేయండి",
    btn_back_overview: "← జాతీయ గ్రిడ్ అవలోకనానికి తిరిగి వెళ్లండి",
    btn_back_prev: "← వెనుకకు",
    
    outbreak_dengue: "డెంగ్యూ వ్యాప్తి హెచ్చరిక",
    outbreak_flood: "వరద సంబంధిత అతిసార వ్యాప్తి",
    outbreak_snakebite: "వ్యవసాయ పాముకాటు అత్యవసరం",
    
    txt_days_runway: "మిగిలి ఉన్న నిల్వ రోజుల సంఖ్య",
    txt_stockout_date: "నిల్వ పూర్తయ్యే అంచనా తేదీ",
    txt_confidence: "95% అంచనా విశ్వసనీయత",
    txt_donor_hub: "మిగులు నిల్వ కేంద్రం",
    txt_receiver: "కొరత ఉన్న ప్రాథమిక ఆరోగ్య కేంద్రం",
    txt_distance: "రవాణా దూరం & సమయం",
    txt_cold_chain: "కోల్డ్ చైన్ అవసరం (2°C - 8°C)",
    txt_ambient: "సాధారణ రవాణా",
    txt_rationale: "AI కేటాయింపు సమర్థన",
    txt_gate_pass: "డిజిటల్ డిస్పాచ్ గేట్ పాస్",
    
    fed_title: "భారత రాష్ట్రాల మధ్య ఫెడరేటెడ్ లెర్నింగ్",
    fed_desc: "రోగుల రహస్య సమాచారాన్ని భద్రపరుస్తూ రాష్ట్రాల స్థాయిలో ప్రిడిక్టివ్ మోడల్ శిక్షణ నిర్వహించబడుతుంది.",
    fed_accuracy: "గ్లోబల్ మోడల్ ఖచ్చితత్వం",
    fed_loss: "గ్లోబల్ టెస్ట్ లాస్",
    fed_records_protected: "రక్షించబడిన రోగుల రికార్డులు",
    fed_gradient_size: "బదిలీ చేయబడిన మోడల్ డేటా పరిమాణం"
  },

  mr: {
    app_title: "आरोग्य पल्स एआय (ArogyaPulse AI)",
    app_subtitle: "राष्ट्रीय आरोग्य संसाधन व पुरवठा साखळी बुद्धिमत्ता ग्रिड",
    tagline: "आरोग्य व कुटुंब कल्याण मंत्रालय | राष्ट्रीय आरोग्य अभियान",
    nav_overview: "राष्ट्रीय ग्रिड आढावा",
    nav_forecasting: "मागणी अंदाज आणि पूर्वसूचना",
    nav_redistribution: "आंतर-जिल्हा स्वयंचलित पुनर्वितरण",
    nav_federated: "फेडरेटेड लर्निंग व राज्य नोड्स",
    nav_copilot: "संजीवनी एआय सहाय्यक",
    nav_stock_entry: "व्हॉईस व व्हिजन नोंदणी",
    
    status_live: "राष्ट्रीय टेलिमेट्री: थेट सुरू (LIVE)",
    status_abdm: "आयुष्मान भारत व DISHA नियमांचे पालन",
    emergency_active: "सक्रिय साथीचा रोग आणीबाणी",
    no_emergency: "सामान्य आरोग्य देखरेख स्थिती",
    
    kpi_phcs: "निरीक्षणाखालील प्राथमिक आरोग्य केंद्रे",
    kpi_beds: "एकूण खाटांचा वापर",
    kpi_staff: "कर्तव्यावर असलेले आरोग्य कर्मचारी",
    kpi_critical: "गंभीर औषध तुटवडा",
    kpi_oxygen: "ऑक्सिजन समर्थित खाटा",
    kpi_icu: "उपलब्ध व्हेंटिलेटर खाटा",
    
    filter_all_states: "संपूर्ण भारत (८ राज्ये)",
    filter_all_types: "सर्व केंद्रे (PHC, CHC, DH)",
    search_placeholder: "केंद्राचे नाव किंवा जिल्ह्यानुसार शोधा...",
    
    btn_simulate_outbreak: "साथीचा रोग सिम्युलेशन",
    btn_reset_baseline: "मूळ स्थिती पुनर्स्थापित करा",
    btn_run_federated: "फेडरेटेड फेरी चालवा",
    btn_execute_all: "सर्व औषध पाठवणी मंजूर करा",
    btn_voice_input: "आवाजाद्वारे आज्ञा द्या",
    btn_settings: "गुगल एआय सेटिंग्ज",
    btn_scan_register: "फोटो स्कॅन करा",
    btn_back_overview: "← राष्ट्रीय ग्रिड आढाव्यावर परत जा",
    btn_back_prev: "← मागे जा",
    
    outbreak_dengue: "डेंग्यू साथीचा उद्रेक",
    outbreak_flood: "पूर जलजन्य अतिसार साथ",
    outbreak_snakebite: "ग्रामीण शेती सर्पदंश आणीबाणी",
    
    txt_days_runway: "उर्वरित साठा दिवस",
    txt_stockout_date: "साठा संपण्याचा अंदाज",
    txt_confidence: "९५% अचूक अंदाज बँड",
    txt_donor_hub: "अतिरिक्त साठा देणारे केंद्र",
    txt_receiver: "तुटवडा असलेले प्राथमिक केंद्र",
    txt_distance: "वाहतूक अंतर आणि वेळ",
    txt_cold_chain: "कोल्ड-चेन आवश्यक (२°C ते ८°C)",
    txt_ambient: "सामान्य वाहतूक",
    txt_rationale: "एआय वाटप विश्लेषण",
    txt_gate_pass: "डिजिटल डिस्पॅच गेट पास",
    
    fed_title: "भारतीय राज्यांमध्ये फेडरेटेड लर्निंग",
    fed_desc: "रुग्णांची वैयक्तिक माहिती सुरक्षित ठेवून राज्यांच्या पातळीवर एकत्रित मॉडेल प्रशिक्षण दिले जाते.",
    fed_accuracy: "जागतिक अचूकता",
    fed_loss: "चाचणी त्रुटी (Loss)",
    fed_records_protected: "सुरक्षित रुग्ण नोंदी",
    fed_gradient_size: "हस्तांतरित मॉडेल आकार"
  }
};

let currentLang = "en";

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) lang = "en";
  currentLang = lang;
  localStorage.setItem("arogya_lang", lang);
  applyTranslations();
  // Dispatch event so active charts or views can re-render
  window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
}

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || 
         (TRANSLATIONS["en"][key]) || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const translated = t(key);
    if (translated) {
      if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    }
  });

  // Update active pill in language dropdown/selector
  const langSelect = document.getElementById("langSelector");
  if (langSelect) langSelect.value = currentLang;
}
