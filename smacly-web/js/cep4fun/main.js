// idioma actual o por defecto
const spanish = "es";
const english = "en";

let currentLang = localStorage.getItem("lang") || spanish;

function loadLanguage(lang) {
  return fetch(`/i18n/${lang}.json`)
    .then(res => res.json())
    .then(dict => {
      window.I18N = dict;
      applyTranslations();
      localStorage.setItem("lang", lang);
      updateToggleButton();
    });
}

function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const text = getNestedValue(window.I18N, key) || key;

    if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit")) {
      el.value = text;
    } else {
      el.textContent = text;
    }
  });
}

function changeLanguage() {
  // alternar idioma
  currentLang = currentLang === spanish ? english : spanish;
  loadLanguage(currentLang).then(() => {
    loadVoiceCommands(currentLang);
    loadLanguageJSTemplate(currentLang);
  });
}

function updateToggleButton() {
  const btn = document.getElementById("toggle-lang-btn");
  const targetLang = currentLang === spanish ? english : spanish;
  btn.dataset.lang = targetLang;

  // cargar el texto del idioma objetivo desde JSON
  fetch(`/i18n/${targetLang}.json`)
    .then(res => res.json())
    .then(dict => {
      btn.text = dict.language_name;  // para input type="button" se usa .value
    });
}

function loadVoiceCommands(lang) {
  const script = document.createElement("script");
  var language = currentLang === spanish ? "spanish" : "english";
  script.src = `js/commands/voice_${language}.js`;
  script.type = "text/javascript";
  script.defer = true; // opcional, para que se ejecute después de cargar
  document.body.appendChild(script);
}

function loadLanguageJSTemplate(lang) {
  const script = document.createElement("script");
  script.src = `js/${lang}.js`;
  script.type = "text/javascript";
  script.defer = true; // opcional, para que se ejecute después de cargar
  document.body.appendChild(script);
}

function translate(key, params = {}) {
  let text = getNestedValue(window.I18N, key) || key;

  Object.keys(params).forEach(p => {
    text = text.replaceAll(`{${p}}`, params[p]);
  });

  return text;
}

// Initialize language
loadLanguage(currentLang).then(() => {
  loadVoiceCommands(currentLang);
  loadLanguageJSTemplate(currentLang);
});