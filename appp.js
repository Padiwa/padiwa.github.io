// ---------------- Configuration par défaut ----------------
const DEFAULT_STEPS_SRC = "dijon.json"; // utilisé si ?steps= n’est pas fourni
const KEY_IDX = "progress_index";
const KEY_DONE = "progress_done";

// ---------------- Utilitaires ----------------
const qs = new URLSearchParams(location.search);
const stepsParam = qs.get("steps") || DEFAULT_STEPS_SRC;
// Optionnel: désactiver le cache en dev avec ?bust=timestamp
const cacheBust = qs.get("bust");
function withBust(url) {
  if (!cacheBust) return url;
  const u = new URL(url, location.href);
  u.searchParams.set("v", cacheBust);
  return u.toString();
}

function norm(s) {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritiques
    .replace(/[\s'’"«»\-_.]/g, ""); // espaces et ponctuation courante
}

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const data = enc.encode(norm(str));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function matchesAnswer(step, value) {
  const v = norm(value);
  if (step.answerHash) {
    const h = await sha256Hex(v);
    return h === step.answerHash.toLowerCase();
  }
  if (step.answer) {
    return v === norm(step.answer);
  }
  return false;
}

// ---------------- Chargement des étapes ----------------
// Supporte:
// - JSON: { steps: [...], finalReward: { text, visibleText } } OU un tableau simple [...]
// - Module ES (.js): export const STEPS = [...]; export const FINAL_REWARD = {...}
async function loadStepsFromUrl(src) {
  const isJsModule = /\.mjs$|\.js$/i.test(src);

  if (isJsModule) {
    // import() nécessite une URL absolue
    const urlAbs = new URL(src, location.href).toString();
    const mod = await import(/* @vite-ignore */ urlAbs);
    const STEPS = mod.STEPS || mod.steps || [];
    const FINAL_REWARD = mod.FINAL_REWARD || mod.finalReward || {};
    if (!Array.isArray(STEPS))
      throw new Error("Le module ne fournit pas un tableau STEPS.");
    return { steps: STEPS, finalReward: FINAL_REWARD };
  }

  // JSON
  const res = await fetch(withBust(src), {
    cache: cacheBust ? "no-store" : "default",
  });
  if (!res.ok) throw new Error(`Impossible de charger ${src} (${res.status})`);
  const data = await res.json();
  let steps, finalReward;

  if (Array.isArray(data)) {
    steps = data;
    finalReward = {};
  } else {
    steps = data.steps;
    finalReward = data.finalReward || data.FINAL_REWARD || {};
  }
  if (!Array.isArray(steps))
    throw new Error("Le JSON ne contient pas un tableau 'steps'.");
  return { steps, finalReward };
}

// ---------------- Sélecteurs DOM ----------------
const elStepNum = document.getElementById("step-num");
const elStepTotal = document.getElementById("step-total");
const elAttempts = document.getElementById("attempts");
const elTitle = document.getElementById("step-title");
const elText = document.getElementById("step-text");
const elHint = document.getElementById("step-hint");
const elUrl = document.getElementById("step-url");
const elInput = document.getElementById("answer");
const elBtn = document.getElementById("check");
const elMsg = document.getElementById("msg");
const elCompleted = document.getElementById("completed");
const elFinalLink = document.getElementById("final-link");
const elNewGame = document.getElementById("newgame");
const divHint = document.getElementById("hint");

// Pendant le chargement
elStepTotal.textContent = "?";

// ---------------- État ----------------
let STEPS = [];
let FINAL_URL = "#";
let idx = 0;

function attKey(i) {
  return `attempts_${i}`;
}

function showCompleted() {
  localStorage.setItem(KEY_DONE, "1");
  elCompleted.style.display = "block";
  divHint.style.display = "none";
  elNewGame.style.display = "block";
  elFinalLink.href = FINAL_URL || "#";
  elFinalLink.textContent = "Ouvrir la récompense";
  elMsg.textContent = "";
  elAttempts.textContent = "";
  elStepNum.textContent = String(STEPS.length);
  elStepTotal.textContent = String(STEPS.length);
}

function render() {
  const done = localStorage.getItem(KEY_DONE) === "1";
  if (done || idx >= STEPS.length) {
    showCompleted();
    return;
  }

  const step = STEPS[idx];
  elStepNum.textContent = String(idx + 1);
  elStepTotal.textContent = String(STEPS.length);
  elTitle.textContent = step.title || `Étape ${idx + 1}`;
  elText.textContent = step.text || "";
  elHint.textContent = step.hint || "";
  elUrl.href = step.url || "#";
  elUrl.style.visibility = step.url ? "visible" : "hidden";

  const attempts = Number(localStorage.getItem(attKey(idx))) || 0;
  elAttempts.textContent = attempts
    ? `${attempts} tentative${attempts > 1 ? "s" : ""}`
    : "";
  elInput.value = "";
  elInput.focus();
  elMsg.textContent = "";
  elCompleted.style.display = "none";
  elNewGame.style.display = "none";
}

async function onCheck() {
  const val = elInput.value.trim();
  if (!val) {
    elMsg.textContent = "Entre une réponse.";
    return;
  }

  const ok = await matchesAnswer(STEPS[idx], val);
  if (ok) {
    elMsg.textContent = "Correct !";
    localStorage.removeItem(attKey(idx));

    if (idx >= STEPS.length - 1) {
      localStorage.setItem(KEY_IDX, String(STEPS.length));
      localStorage.setItem(KEY_DONE, "1");
      showCompleted();
    } else {
      idx += 1;
      localStorage.setItem(KEY_IDX, String(idx));
      render();
    }
  } else {
    const k = attKey(idx);
    const attempts = (Number(localStorage.getItem(k)) || 0) + 1;
    localStorage.setItem(k, String(attempts));
    elAttempts.textContent = `${attempts} tentative${attempts > 1 ? "s" : ""}`;
    elMsg.textContent = "Raté. Réessaie (casse/accents/espaces ignorés).";
  }
}

function onEnter(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    elBtn.click();
  }
}

function restart() {
  localStorage.removeItem(KEY_DONE);
  localStorage.removeItem(KEY_IDX);
  for (let i = 0; i < STEPS.length; i++) localStorage.removeItem(attKey(i));
  idx = 0;
  render();
}
window.restart = restart;

// ---------------- Init ----------------
async function init() {
  try {
    // Charger les étapes depuis ?steps=
    const { steps, finalReward } = await loadStepsFromUrl(stepsParam);

    // Déterminer l’URL finale:
    // priorité au finalReward.text si fourni, sinon garder l’ancienne valeur si tu en as une.
    FINAL_URL =
      (finalReward && finalReward.text) ||
      "https://www.youtube.com/watch?v=CS9OO0S5w2k&ab_channel=VillagePeople";

    // Copier les étapes (petite validation)
    STEPS = steps.map((st, i) => {
      ["title", "text", "hint", "url"].forEach((k) => {
        if (!st[k]) console.warn(`Étape ${i}: champ manquant ${k}`);
      });
      return st;
    });

    // Indice courant
    idx = Number(localStorage.getItem(KEY_IDX));
    if (!Number.isFinite(idx) || idx < 0) idx = 0;
    if (idx > STEPS.length - 1) idx = STEPS.length - 1;

    // Bind événements (après que le DOM soit prêt)
    elBtn.addEventListener("click", onCheck);
    elInput.addEventListener("keydown", onEnter);

    render();
  } catch (e) {
    console.error(e);
    elMsg.textContent = "Erreur de chargement des étapes.";
  }
}

// Lancer
init();
