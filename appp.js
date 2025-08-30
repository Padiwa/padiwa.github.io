const FINAL_URL =
  "https://www.youtube.com/watch?v=CS9OO0S5w2k&ab_channel=VillagePeoplehttps://www.youtube.com/watch?v=CS9OO0S5w2k&ab_channel=VillagePeople"; // ou 'boite.html' selon la page de récompense que tu utilises
const KEY_IDX = "progress_index"; // index d’étape (0-based)
const KEY_DONE = "progress_done"; // "1" quand tout est validé

// Exemple d'étapes : remplace par les tiennes.
// Tu peux utiliser "answer" (en clair) OU "answerHash" (SHA-256 hex). Si les deux sont présents, answerHash est prioritaire.
const STEPS = [
  {
    title: "Le pavillon aux os croisés",
    text: "Cher moussaillon, trouve le nom anglais du célèbre drapeau pirate à tête de mort.",
    hint: "Drapeau pirate en anglais, deux mots.",
    url: "https://fr.wikipedia.org/wiki/Jolly_Roger",
    answer: "jollyroger",
  },
  {
    title: "Le navire de Barbe Noire",
    text: "Quel était le nom du vaisseau amiral de Barbe Noire ?",
    hint: "Le navire porte le nom d’une reine.",
    url: "https://fr.wikipedia.org/wiki/Queen_Anne%27s_Revenge",
    answer: "queenannesrevenge",
  },
  {
    title: "L’île au trésor",
    text: "Retrouve le titre original (en anglais) du roman « L’Île au trésor ».",
    hint: "Roman d’aventure de R. L. Stevenson, deux mots.",
    url: "https://fr.wikipedia.org/wiki/L%27%C3%8Ele_au_tr%C3%A9sor",
    answer: "treasureisland",
  },
  {
    title: "Frères de la côte",
    text: "Les flibustiers firent de l’« Île de la Tortue » leur repaire. De quel pays dépend-elle aujourd’hui ?",
    hint: "Pays des Caraïbes, langue française.",
    url: "https://fr.wikipedia.org/wiki/%C3%8Ele_de_la_Tortue_(Ha%C3%AFti)",
    answer: "haiti",
  },
  {
    title: "Port englouti",
    text: "Port Royal, jadis repaire de pirates. Dans quel pays moderne se trouve cette ville portuaire ?",
    hint: "Île des Caraïbes, patrie du reggae.",
    url: "https://fr.wikipedia.org/wiki/Port_Royal_(Jama%C3%AFque)",
    answer: "jamaique",
  },
  {
    title: "Les « Pyrates » à l’ancienne",
    text: "Daniel Defoe (attribué) publie une « Histoire générale des plus fameux… » avec une orthographe archaïque du mot « pirates ». Quelle est-elle ?",
    hint: "Orthographe anglaise ancienne en ‘y’.",
    url: "https://fr.wikipedia.org/wiki/Histoire_g%C3%A9n%C3%A9rale_des_plus_fameux_pirates",
    answer: "pyrates",
  },
  {
    title: "La perle noire",
    text: "Dans le premier film Pirates des Caraïbes, comment s’appelle le navire de Jack Sparrow ?",
    hint: "Deux mots, couleur + gemme.",
    url: "https://fr.wikipedia.org/wiki/Pirates_des_Cara%C3%AFbes_:_La_Mal%C3%A9diction_du_Black_Pearl",
    answer: "blackpearl",
  },
  {
    title: "Cap sur le méridien",
    text: "Quel observatoire donne son nom au méridien d’origine utilisé par les cartes modernes ?",
    hint: "Observatoire au sud-est de Londres.",
    url: "https://fr.wikipedia.org/wiki/M%C3%A9ridien_de_Greenwich",
    answer: "greenwich",
  },
  {
    title: "Le butin des trois ingrédients",
    text: "Dans la chanson Wellerman, quels sont les trois produits que le navire apporte ? Donne le dernier des trois (en anglais).",
    hint: "Refrain: “sugar and tea and ___”.",
    url: "https://fr.wikipedia.org/wiki/Wellerman",
    answer: "rum",
  },
];

function norm(s) {
  if (!s) return "";
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime les diacritiques
    .replace(/\s+/g, ""); // supprime les espaces
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
    // compare au hash de la "bonne" réponse normalisée
    return h === step.answerHash.toLowerCase();
  }
  if (step.answer) {
    return v === norm(step.answer);
  }
  return false;
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

elStepTotal.textContent = String(STEPS.length);

// ---------------- État ----------------
let idx = Number(localStorage.getItem(KEY_IDX));
if (Number.isNaN(idx) || idx < 0) idx = 0;
if (idx > STEPS.length - 1) idx = STEPS.length - 1;

function attKey(i) {
  return `attempts_${i}`;
}

function render() {
  // Terminé ?
  const done = localStorage.getItem(KEY_DONE) === "1";
  if (done || idx >= STEPS.length) {
    showCompleted();
    return;
  }

  const step = STEPS[idx];
  elStepNum.textContent = String(idx + 1);
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

function showCompleted() {
  localStorage.setItem(KEY_DONE, "1");
  elCompleted.style.display = "block";
  divHint.style.display = "none";
  elNewGame.style.display = "block";
  elFinalLink.href = FINAL_URL;
  elFinalLink.textContent = "Ouvrir la récompense";
  elMsg.textContent = "";
  elAttempts.textContent = "";
  // Affiche "Étape n/n"
  elStepNum.textContent = String(STEPS.length);
  elStepTotal.textContent = String(STEPS.length);
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
    // reset tentatives de l’étape en cours
    localStorage.removeItem(attKey(idx));

    if (idx >= STEPS.length - 1) {
      // fini
      localStorage.setItem(KEY_IDX, String(STEPS.length)); // depasse le dernier pour signaler "fin"
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
    elMsg.textContent =
      "Raté. Réessaye en vérifiant l’orthographe (casse/accents/espaces ignorés).";
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

elBtn.addEventListener("click", onCheck);
elInput.addEventListener("keydown", onEnter);

render();
