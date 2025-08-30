const normalize = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();

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
  //   {
  //     title: "L’île au trésor",
  //     text: "Retrouve le titre original (en anglais) du roman « L’Île au trésor ».",
  //     hint: "Roman d’aventure de R. L. Stevenson, deux mots.",
  //     url: "https://fr.wikipedia.org/wiki/L%27%C3%8Ele_au_tr%C3%A9sor",
  //     answer: "treasureisland",
  //   },
  {
    title: "Frères de la côte",
    text: "Les flibustiers firent de l’« Île de la Tortue » leur repaire. De quel pays dépend-elle aujourd’hui ?",
    hint: "Pays des Caraïbes, langue française.",
    url: "https://fr.wikipedia.org/wiki/%C3%8Ele_de_la_Tortue_(Ha%C3%AFti)",
    answer: "haiti",
  },
  //   {
  //     title: "Port englouti",
  //     text: "Port Royal, jadis repaire de pirates. Dans quel pays moderne se trouve cette ville portuaire ?",
  //     hint: "Île des Caraïbes, patrie du reggae.",
  //     url: "https://fr.wikipedia.org/wiki/Port_Royal_(Jama%C3%AFque)",
  //     answer: "jamaique",
  //   },
  //   {
  //     title: "Le crâne qui rit",
  //     text: "Quel est le surnom anglais du drapeau pirate, formé d’un adjectif et d’un prénom ?",
  //     hint: "Même réponse que l’étape 1.",
  //     url: "https://fr.wikipedia.org/wiki/Jolly_Roger",
  //     answer: "jollyroger",
  //   },
  //   {
  //     title: "Les « Pyrates » à l’ancienne",
  //     text: "Daniel Defoe (attribué) publie une « Histoire générale des plus fameux… » avec une orthographe archaïque du mot « pirates ». Quelle est-elle ?",
  //     hint: "Orthographe anglaise ancienne en ‘y’.",
  //     url: "https://fr.wikipedia.org/wiki/Histoire_g%C3%A9n%C3%A9rale_des_plus_fameux_pirates",
  //     answer: "pyrates",
  //   },
  //   {
  //     title: "La perle noire",
  //     text: "Dans le premier film Pirates des Caraïbes, comment s’appelle le navire de Jack Sparrow ?",
  //     hint: "Deux mots, couleur + gemme.",
  //     url: "https://fr.wikipedia.org/wiki/Pirates_des_Cara%C3%AFbes_:_La_Mal%C3%A9diction_du_Black_Pearl",
  //     answer: "blackpearl",
  //   },
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

// Récompense finale
const FINAL_REWARD = {
  text: "https://www.youtube.com/watch?v=CS9OO0S5w2k&ab_channel=VillagePeople",
  visibleText: "Ouvrir le coffre au trésor",
};

// État
const total = STEPS.length;
const stateKey = "pirate.treasure.currentStep.v1";
const attemptsKey = "pirate.treasure.attempts.v1";
let current = parseInt(localStorage.getItem(stateKey) || "0", 10);
let attempts = JSON.parse(localStorage.getItem(attemptsKey) || "[]");

// DOM
const elNum = document.getElementById("step-num");
const elTotal = document.getElementById("step-total");
const elTitle = document.getElementById("step-title");
const elText = document.getElementById("step-text");
const elHint = document.getElementById("step-hint");
const elUrl = document.getElementById("step-url");
const elAnswer = document.getElementById("answer");
const elCheck = document.getElementById("check");
const elMsg = document.getElementById("msg");
const elAttempts = document.getElementById("attempts");
const elCompleted = document.getElementById("completed");
const newGame = document.getElementById("newgame");
const elFinalLink = document.getElementById("final-link");
const restartLink = document.getElementById("restart-link");

elTotal.textContent = total;

function render() {
  if (!attempts[current]) attempts[current] = 0;
  localStorage.setItem(attemptsKey, JSON.stringify(attempts));

  if (current >= total) {
    document.querySelector("label[for=answer]").style.display = "none";
    elAnswer.style.display = "none";
    elCheck.style.display = "none";
    elMsg.textContent = "";
    elCompleted.style.display = "block";
    elFinalLink.href = FINAL_REWARD.text;
    elFinalLink.textContent = FINAL_REWARD.visibleText || FINAL_REWARD.text;
    document.querySelector(".nav").style.display = "none";
    document.getElementById("hint").style.display = "none";
    newGame.style.display = "block";
    confettiParrot();
    if (restartLink) return;
  }

  const s = STEPS[current];
  elNum.textContent = current + 1;
  elTitle.textContent = s.title;
  elText.textContent = s.text;
  elHint.textContent = s.hint;
  elUrl.href = s.url;
  elUrl.textContent = "Mettre le cap sur l’indice";
  elMsg.textContent = "Capitaine: saisis le mot de passe pour poursuivre.";
  elAttempts.textContent = `Essais: ${attempts[current]}`;
  elAnswer.value = "";
  elAnswer.focus();
}

function checkAnswer() {
  const user = normalize(elAnswer.value);
  attempts[current] = (attempts[current] || 0) + 1;
  localStorage.setItem(attemptsKey, JSON.stringify(attempts));

  const expected = normalize(STEPS[current].answer);
  if (user && user === expected) {
    elMsg.className = "ok";
    elMsg.textContent = "Correct, moussaillon ! Étape suivante…";
    seaBell();
    current++;
    localStorage.setItem(stateKey, String(current));
    setTimeout(render, 600);
  } else {
    elMsg.className = "err";
    elMsg.textContent = "Faux cap ! Reviens à la carte et vérifie l’indice.";
    elAttempts.textContent = `Essais: ${attempts[current]}`;
    thud();
  }
}

elCheck.addEventListener("click", checkAnswer);
elAnswer.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkAnswer();
});

render();

let audioCtx;
function ensureCtx() {
  audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
}
function tone(freq = 880, dur = 0.14, type = "sine", vol = 0.06) {
  ensureCtx();
  const o = audioCtx.createOscillator(),
    g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g).connect(audioCtx.destination);
  o.start();
  setTimeout(() => {
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
    o.stop(audioCtx.currentTime + 0.1);
  }, dur * 1000);
}
function seaBell() {
  tone(784, 0.08, "triangle", 0.05);
  setTimeout(() => tone(1047, 0.12, "triangle", 0.05), 90);
}
function thud() {
  tone(120, 0.12, "sawtooth", 0.03);
}

function confettiParrot() {
  const colors = [
    "#e63946",
    "#ffd166",
    "#06d6a0",
    "#118ab2",
    "#e9c46a",
    "#f77f00",
  ];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement("span");
    s.style.position = "fixed";
    s.style.left = Math.random() * 100 + "vw";
    s.style.top = "-5vh";
    s.style.width = "10px";
    s.style.height = "18px";
    s.style.background = colors[i % colors.length];
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    s.style.borderRadius = "2px";
    s.style.opacity = 0.9;
    s.style.zIndex = 9999;
    document.body.appendChild(s);
    const dx = (Math.random() * 2 - 1) * 30;
    const dur = 3000 + Math.random() * 2000;
    s.animate(
      [
        { transform: s.style.transform, offset: 0, top: "-5vh" },
        {
          transform: `translate(${dx}px, 95vh) rotate(${
            Math.random() * 360
          }deg)`,
          offset: 1,
          top: "95vh",
        },
      ],
      { duration: dur, easing: "cubic-bezier(.2,.7,.2,1)" }
    ).onfinish = () => s.remove();
  }
}
function restart() {
  localStorage.removeItem(stateKey);
  localStorage.removeItem(attemptsKey);
}
