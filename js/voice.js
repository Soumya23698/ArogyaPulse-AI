/**
 * voice.js
 * Multilingual Speech Recognition (Voice Input) & Speech Synthesis (TTS)
 * for ArogyaPulse AI & Frontline PHC Healthcare Staff
 */

let speechRecognizer = null;
let isListening = false;
let currentVoiceLang = "en-IN";

const LANG_CODE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN"
};

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API not supported in this browser.");
    return null;
  }

  const recognizer = new SpeechRecognition();
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.lang = LANG_CODE_MAP[currentLang] || "en-IN";

  return recognizer;
}

function startVoiceAssistant(onResultCallback, onEndCallback) {
  speechRecognizer = initSpeechRecognition();
  if (!speechRecognizer) {
    alert("Speech recognition is not supported in this browser. Please use Chrome or Edge, or type your query.");
    return;
  }

  speechRecognizer.lang = LANG_CODE_MAP[currentLang] || "en-IN";

  speechRecognizer.onstart = () => {
    isListening = true;
    console.log("Voice recognition active for language:", speechRecognizer.lang);
    document.querySelectorAll(".btn-mic-pulse").forEach(b => b.classList.add("recording"));
  };

  speechRecognizer.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("Speech recognized:", transcript);
    if (onResultCallback) onResultCallback(transcript);
  };

  speechRecognizer.onerror = (event) => {
    console.warn("Speech recognition error:", event.error);
    if (event.error === 'not-allowed') {
      alert("Microphone access was denied. Please allow microphone permissions in your browser.");
    }
  };

  speechRecognizer.onend = () => {
    isListening = false;
    document.querySelectorAll(".btn-mic-pulse").forEach(b => b.classList.remove("recording"));
    if (onEndCallback) onEndCallback();
  };

  speechRecognizer.start();
}

function stopVoiceAssistant() {
  if (speechRecognizer && isListening) {
    speechRecognizer.stop();
  }
}

/**
 * Text-to-Speech synthesizer for AI responses
 */
function speakTextAloud(text, lang) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel(); // Cancel any ongoing speech

  // Strip markdown formatting for cleaner speech
  const cleanText = text
    .replace(/[*#_>`]/g, "")
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/TRX-[A-Z0-9-]+/g, "Transfer Order")
    .replace(/https?:\/\/\S+/g, "");

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = LANG_CODE_MAP[lang] || "en-IN";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
}

/**
 * Parses frontline spoken stock logs (e.g. "Received 500 Paracetamol" or "५०० पैरासिटामोल प्राप्त हुए")
 */
function parseFrontlineVoiceStock(transcript) {
  const t = transcript.toLowerCase();
  
  // Extract number (English or Devanagari numerals)
  let quantity = 0;
  const numMatch = transcript.match(/\d+/);
  if (numMatch) {
    quantity = parseInt(numMatch[0]);
  } else {
    // English words for numbers
    if (t.includes("hundred") || t.includes("सौ")) quantity = 100;
    else if (t.includes("fifty") || t.includes("पचास")) quantity = 50;
    else if (t.includes("twenty") || t.includes("बीस")) quantity = 20;
    else if (t.includes("ten") || t.includes("दस")) quantity = 10;
    else quantity = 100; // default assumption
  }

  // Match medicine
  let matchedMedId = "MED-01";
  let medName = "Paracetamol 500mg Tablets";

  if (t.includes("snake") || t.includes("venom") || t.includes("सांप") || t.includes("विष") || t.includes("asv")) {
    matchedMedId = "MED-04";
    medName = "Anti-Snake Venom (ASV) Lyophilized";
  } else if (t.includes("rabies") || t.includes("arv") || t.includes("रेबीज")) {
    matchedMedId = "MED-05";
    medName = "Rabies Vaccine (ARV) 0.5ml";
  } else if (t.includes("ors") || t.includes("ओआरएस") || t.includes("salt")) {
    matchedMedId = "MED-03";
    medName = "ORS (Oral Rehydration Salts) 21.8g";
  } else if (t.includes("amoxicillin") || t.includes("एमोक्सिसिलिन") || t.includes("antibiotic")) {
    matchedMedId = "MED-02";
    medName = "Amoxicillin 500mg Capsules";
  } else if (t.includes("oxygen") || t.includes("सिलेंडर") || t.includes("ऑक्सीजन")) {
    matchedMedId = "SUP-01";
    medName = "Medical Oxygen Cylinder (Type D)";
  } else if (t.includes("dengue") || t.includes("डेंगू")) {
    matchedMedId = "SUP-02";
    medName = "Rapid Dengue NS1/IgM/IgG Test Kit";
  }

  return {
    transcript: transcript,
    medicine_id: matchedMedId,
    medicine_name: medName,
    quantity: quantity,
    operation: "ADD"
  };
}
