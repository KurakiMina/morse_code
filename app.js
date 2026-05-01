const NS = "http://www.w3.org/2000/svg";
const LONG_PRESS_MS = 300;
const GAME_SECONDS = 40;
const RANKING_KEY = "morseClassicGameRanking";
const INPUT_MAX_LENGTH = 5;
const INPUT_EXPIRE_MS = 1000;

const DIFFICULTY_META = {
  easy: { label: "Easy", multiplier: 1.0, level: 1 },
  normal: { label: "Normal", multiplier: 1.2, level: 2 },
  hard: { label: "Hard", multiplier: 1.5, level: 3 },
  expert: { label: "Expert", multiplier: 2.0, level: 4 },
  master: { label: "Master", multiplier: 2.6, level: 5 }
};

const TITLES = [
  { min: 0, title: "Beginner" },
  { min: 500, title: "Operator" },
  { min: 1000, title: "Signal Master" },
  { min: 1800, title: "Morse Ace" },
  { min: 2800, title: "Chief Operator" }
];

const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----."
};
const CODE_TO_CHAR = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
const KANA_MORSE = {
  "あ": "--.--", "い": ".-", "う": "..-", "え": "-.---", "お": ".-...",
  "か": ".-..", "き": "-.-..", "く": "...-", "け": "-.--", "こ": "----",
  "さ": "-.-.-", "し": "--.-.", "す": "---.-", "せ": ".---.", "そ": "---.",
  "た": "-.", "ち": "..-.", "つ": ".--.", "て": ".-.--", "と": "..-..",
  "な": ".-.", "に": "-.-.", "ぬ": "....", "ね": "--.-", "の": "..--",
  "は": "-...", "ひ": "--..-", "ふ": "--..", "へ": ".", "ほ": "-..",
  "ま": "-..-", "み": "..-.-", "む": "-", "め": "-...-", "も": "-..-.",
  "や": ".--", "ゆ": "-..--", "よ": "--",
  "ら": "...", "り": "--.", "る": "-.--.", "れ": "---", "ろ": ".-.-",
  "わ": "-.-", "を": ".---", "ん": ".-.-.", "ー": ".--.-"
};
const KANA_DAKUTEN = {
  "が": ["か", ".."], "ぎ": ["き", ".."], "ぐ": ["く", ".."], "げ": ["け", ".."], "ご": ["こ", ".."],
  "ざ": ["さ", ".."], "じ": ["し", ".."], "ず": ["す", ".."], "ぜ": ["せ", ".."], "ぞ": ["そ", ".."],
  "だ": ["た", ".."], "ぢ": ["ち", ".."], "づ": ["つ", ".."], "で": ["て", ".."], "ど": ["と", ".."],
  "ば": ["は", ".."], "び": ["ひ", ".."], "ぶ": ["ふ", ".."], "べ": ["へ", ".."], "ぼ": ["ほ", ".."]
};
const KANA_HANDAKUTEN = { "ぱ": ["は", "..--."], "ぴ": ["ひ", "..--."], "ぷ": ["ふ", "..--."], "ぺ": ["へ", "..--."], "ぽ": ["ほ", "..--."] };
const SMALL_KANA_MAP = { "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お", "ゃ": "や", "ゅ": "ゆ", "ょ": "よ", "っ": "つ", "ゎ": "わ" };
const KANA_BASIC = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と", "な", "に", "ぬ", "ね", "の", "は", "ひ", "ふ", "へ", "ほ", "ま", "み", "む", "め", "も", "や", "ゆ", "よ", "ら", "り", "る", "れ", "ろ", "わ", "を", "ん"];
const KANA_MARKED = ["が", "ぎ", "ぐ", "げ", "ご", "ざ", "じ", "ず", "ぜ", "ぞ", "だ", "ぢ", "づ", "で", "ど", "ば", "び", "ぶ", "べ", "ぼ", "ぱ", "ぴ", "ぷ", "ぺ", "ぽ"];

const WORDS = {
  easy: ["IT", "ON", "GO", "UP", "NO", "CAT", "DOG", "SUN", "SKY", "SEA"],
  normal: ["CODE", "WAVE", "RADIO", "LIGHT", "TRAIN", "MOON", "ALERT", "BEAM", "STAR"],
  hard: ["MORSE", "SIGNAL", "BEACON", "STATION", "PLANET", "ROCKET", "VECTOR", "ORBIT"],
  expert: ["TELEGRAM", "WIRELESS", "OPERATOR", "SIGNAL7", "RADIO5", "BEACON9", "STATION4", "VECTOR8"],
  master: ["TRANSMISSION", "COMMUNICATION", "NAVIGATION7", "FREQUENCY5", "SATELLITE9", "OBSERVATORY2"]
};

/* Classic board coordinates: kept for the accepted classic UI. */
const BOARD_NODES = {
  "": { x: 480, y: 92, kind: "root", label: "" },

  "-": { x: 374, y: 150, kind: "dash", label: "T", lx: 336, ly: 133 },
  ".": { x: 520, y: 198, kind: "dot", label: "E", lx: 575, ly: 174 },

  "--": { x: 265, y: 150, kind: "dash", label: "M", lx: 230, ly: 125 },
  "-.": { x: 375, y: 520, kind: "dot", label: "N", lx: 413, ly: 492 },
  ".-": { x: 520, y: 535, kind: "dash", label: "A", lx: 475, ly: 560 },
  "..": { x: 625, y: 198, kind: "dot", label: "I", lx: 655, ly: 174 },

  "---": { x: 140, y: 150, kind: "dash", label: "O", lx: 110, ly: 105 },
  "--.": { x: 265, y: 330, kind: "dot", label: "G", lx: 312, ly: 300 },
  "-.-": { x: 265, y: 555, kind: "dash", label: "K", lx: 230, ly: 590 },
  "-..": { x: 375, y: 720, kind: "dot", label: "D", lx: 425, ly: 695 },
  ".--": { x: 520, y: 725, kind: "dash", label: "W", lx: 475, ly: 748 },
  ".-.": { x: 625, y: 535, kind: "dot", label: "R", lx: 655, ly: 585 },
  "..-": { x: 625, y: 330, kind: "dash", label: "U", lx: 575, ly: 340 },
  "...": { x: 728, y: 198, kind: "dot", label: "S", lx: 760, ly: 174 },

  "----": { x: 0, y: 0, kind: "dash", label: "" },
  "--..": { x: 265, y: 430, kind: "dot", label: "Z", lx: 315, ly: 430 },
  "--.-": { x: 140, y: 330, kind: "dash", label: "Q", lx: 92, ly: 382 },
  "-.--": { x: 140, y: 555, kind: "dash", label: "Y", lx: 42, ly: 540 },
  "-.-.": { x: 265, y: 675, kind: "dot", label: "C", lx: 314, ly: 650 },
  "-...": { x: 375, y: 865, kind: "dot", label: "B", lx: 322, ly: 850 },
  "-..-": { x: 265, y: 720, kind: "dash", label: "X", lx: 168, ly: 720 },
  ".---": { x: 520, y: 900, kind: "dash", label: "J", lx: 570, ly: 900 },
  ".--.": { x: 625, y: 725, kind: "dot", label: "P", lx: 670, ly: 730 },
  ".-..": { x: 730, y: 535, kind: "dot", label: "L", lx: 785, ly: 535 },
  ".-.-": { x: 0, y: 0, kind: "dot", label: "" },
  "..-.": { x: 625, y: 430, kind: "dot", label: "F", lx: 670, ly: 450 },
  "...-": { x: 728, y: 330, kind: "dash", label: "V", lx: 780, ly: 318 },
  "....": { x: 835, y: 198, kind: "dot", label: "H", lx: 875, ly: 170 }
};

const BOARD_EDGES = Object.keys(BOARD_NODES)
  .filter(code => code.length > 0 && BOARD_NODES[code].x > 0)
  .map(code => ({ from: code.slice(0, -1), to: code }));

const DIGIT_POSITIONS = [
  { char: "1", code: ".----", x: 90, y: 935 },
  { char: "2", code: "..---", x: 185, y: 935 },
  { char: "3", code: "...--", x: 280, y: 935 },
  { char: "4", code: "....-", x: 375, y: 935 },
  { char: "5", code: ".....", x: 470, y: 935 },
  { char: "6", code: "-....", x: 565, y: 935 },
  { char: "7", code: "--...", x: 660, y: 935 },
  { char: "8", code: "---..", x: 755, y: 935 },
  { char: "9", code: "----.", x: 850, y: 935 },
  { char: "0", code: "-----", x: 850, y: 80 }
];

const state = {
  screen: "mode",
  code: "",
  output: "",
  classicExpireTimer: null,
  meterRaf: null,
  practice: {
    code: "",
    output: "",
    expireTimer: null
  },
  training: {
    mode: "latin",
    level: "basic",
    target: "A",
    partIndex: 0,
    input: "",
    wrong: false,
    correct: 0,
    misses: 0,
    streak: 0,
    lastTarget: null
  },
  soundEnabled: true,
  audioContext: null,
  game: null
};

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  [
    "modeScreen", "classicScreen", "practiceScreen", "trainingScreen", "gameScreen",
    "soundToggleButton",
    "classicModeButton", "practiceModeButton", "gameModeButton", "trainingModeButton",
    "classicBackButton", "practiceBackButton", "trainingBackButton", "gameBackButton",

    "currentCode", "currentLetter", "outputText", "timeBar", "morseBoard",
    "keyButton", "spaceButton", "deleteButton", "resetButton",

    "practiceCurrentCode", "practiceCurrentLetter", "practiceOutputText", "practiceBoard",
    "practiceKeyButton", "practiceHoldBar", "practiceSpaceButton", "practiceDeleteButton", "practiceResetButton",

    "trainingLevelSelect", "trainingRouteMap", "trainingTargetChar", "trainingTargetSub", "trainingCurrentInput", "trainingMessage",
    "trainingDotButton", "trainingDashButton", "trainingKeyButton", "trainingHoldBar", "trainingResetButton", "trainingNextButton",
    "trainingOkCount", "trainingMissCount", "trainingStreakCount", "trainingCharGrid",

    "gameIntroPanel", "gamePlayPanel", "gameResultPanel",
    "startGameButton", "playAgainButton", "backToGameIntroButton",
    "gameKeyButton", "gameHoldBar", "gameDotButton", "gameDashButton", "gameSpaceButton", "gameDeleteButton", "gameQuitButton",
    "gameTime", "gameTimerBar", "gameScore", "gameCombo", "gameMaxCombo",
    "gameLevel", "gameTitle", "gameDifficultyBadge", "gameEffectLayer",
    "gameWord", "gameWordProgress", "gameCurrentLetter", "gameCurrentCode", "gameExpectedCode", "gameLastInputCode", "gameInputDots", "gameMessage", "gameBoard",
    "resultScore", "resultWords", "resultChars", "resultMaxCombo", "resultLevel", "resultTitle", "resultWeakLetters",
    "rankingList"
  ].forEach(id => el[id] = document.getElementById(id));

  el.classicModeButton.addEventListener("click", () => showScreen("classic"));
  el.practiceModeButton.addEventListener("click", () => showScreen("practice"));
  el.gameModeButton.addEventListener("click", () => showScreen("game"));
  el.trainingModeButton.addEventListener("click", () => showScreen("training"));

  setupSoundToggles();

  el.classicBackButton.addEventListener("click", () => showScreen("mode"));
  el.practiceBackButton.addEventListener("click", () => showScreen("mode"));
  el.trainingBackButton.addEventListener("click", () => showScreen("mode"));
  el.gameBackButton.addEventListener("click", () => {
    stopGame();
    showScreen("mode");
  });

  setupPressButton(el.keyButton, addClassicSymbol, el.timeBar, null, true);
  el.spaceButton.addEventListener("click", confirmClassic);
  el.deleteButton.addEventListener("click", deleteClassic);
  el.resetButton.addEventListener("click", resetClassic);

  setupPressButton(el.practiceKeyButton, addPracticeSymbol, null, el.practiceHoldBar, true);
  el.practiceSpaceButton.addEventListener("click", confirmPractice);
  el.practiceDeleteButton.addEventListener("click", deletePractice);
  el.practiceResetButton.addEventListener("click", resetPractice);

  setupTraining();

  setupPressButton(el.gameKeyButton, addGameSymbol, null, el.gameHoldBar, true);
  el.gameDotButton.addEventListener("click", () => {
    playSe("dot");
    addGameSymbol(".");
  });
  el.gameDashButton.addEventListener("click", () => {
    playSe("dash");
    addGameSymbol("-");
  });
  el.gameSpaceButton.addEventListener("click", clearGameInput);
  el.gameDeleteButton.addEventListener("click", deleteGameInput);
  el.gameQuitButton.addEventListener("click", endGame);
  el.startGameButton.addEventListener("click", startGame);
  el.playAgainButton.addEventListener("click", startGame);
  el.backToGameIntroButton.addEventListener("click", showGameIntro);

  document.addEventListener("keydown", handleKeyboard);

  renderClassicBoard();
  updateClassic();
  renderBoardTo(el.practiceBoard, "");
  updatePractice();
  chooseTrainingTarget();
  showGameIntro();
  renderRanking();
});

function showScreen(screen) {
  state.screen = screen;
  el.modeScreen.classList.toggle("hidden", screen !== "mode");
  el.classicScreen.classList.toggle("hidden", screen !== "classic");
  el.practiceScreen.classList.toggle("hidden", screen !== "practice");
  el.trainingScreen.classList.toggle("hidden", screen !== "training");
  el.gameScreen.classList.toggle("hidden", screen !== "game");

  if (screen === "classic") {
    renderClassicBoard();
    updateClassic();
  }
  if (screen === "practice") {
    updatePractice();
  }
  if (screen === "training") {
    updateTraining();
  }
  if (screen === "game") {
    showGameIntro();
    renderRanking();
  }
}

function setupPressButton(button, callback, meter, buttonBar = null, enableSe = false) {
  let startAt = 0;
  let active = false;
  let holdRaf = null;
  let activePointerId = null;

  const resetButtonBar = () => {
    if (holdRaf) cancelAnimationFrame(holdRaf);
    holdRaf = null;
    if (buttonBar) {
      buttonBar.style.height = "0%";
      button.classList.remove("short-ready", "long-ready");
    }
  };

  const updateButtonBar = () => {
    if (!buttonBar || !active) return;
    const elapsed = performance.now() - startAt;
    const pct = Math.min(100, elapsed / LONG_PRESS_MS * 100);
    buttonBar.style.height = `${pct}%`;
    button.classList.toggle("short-ready", elapsed < LONG_PRESS_MS);
    button.classList.toggle("long-ready", elapsed >= LONG_PRESS_MS);
    holdRaf = requestAnimationFrame(updateButtonBar);
  };

  const start = event => {
    event.preventDefault();
    active = true;
    activePointerId = event.pointerId;
    startAt = performance.now();
    button.classList.add("pressing");

    try {
      if (button.setPointerCapture && event.pointerId != null) {
        button.setPointerCapture(event.pointerId);
      }
    } catch {}

    if (meter) updateMeter(meter, startAt);
    updateButtonBar();
    if (enableSe) playSe("press");
  };

  const finish = event => {
    if (!active) return;
    if (event && activePointerId != null && event.pointerId != null && event.pointerId !== activePointerId) return;

    event?.preventDefault?.();
    active = false;
    activePointerId = null;
    button.classList.remove("pressing");

    if (state.meterRaf) cancelAnimationFrame(state.meterRaf);
    if (meter) meter.style.width = "0%";

    const elapsed = performance.now() - startAt;
    const symbol = elapsed >= LONG_PRESS_MS ? "-" : ".";
    resetButtonBar();

    if (enableSe) playSe(symbol === "." ? "dot" : "dash");
    callback(symbol);
  };

  const cancel = event => {
    if (!active) return;
    event?.preventDefault?.();
    active = false;
    activePointerId = null;
    button.classList.remove("pressing");
    if (state.meterRaf) cancelAnimationFrame(state.meterRaf);
    if (meter) meter.style.width = "0%";
    resetButtonBar();
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", finish);
  button.addEventListener("pointercancel", cancel);

  // Pointer captureが効かない環境向けの保険。
  document.addEventListener("pointerup", finish);
  document.addEventListener("pointercancel", cancel);
}

function updateMeter(meter, startAt) {
  const elapsed = performance.now() - startAt;
  const pct = Math.min(100, elapsed / LONG_PRESS_MS * 100);
  meter.style.width = `${pct}%`;
  state.meterRaf = requestAnimationFrame(() => updateMeter(meter, startAt));
}

function setupSoundToggles() {
  const toggles = Array.from(document.querySelectorAll("[data-sound-toggle]"));
  if (el.soundToggleButton) toggles.unshift(el.soundToggleButton);

  const sync = () => {
    toggles.forEach(button => {
      button.textContent = state.soundEnabled ? "音声 ON" : "音声 OFF";
      button.setAttribute("aria-pressed", String(state.soundEnabled));
    });
  };

  toggles.forEach(button => {
    button.addEventListener("click", async () => {
      state.soundEnabled = !state.soundEnabled;
      if (state.soundEnabled) {
        await ensureAudioContext();
        playSe("toggle");
      }
      sync();
    });
  });

  sync();
}

async function ensureAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!state.audioContext) {
    state.audioContext = new AudioContextClass();
  }

  if (state.audioContext.state === "suspended") {
    try {
      await state.audioContext.resume();
    } catch {
      return null;
    }
  }

  return state.audioContext;
}

function playSe(type) {
  if (!state.soundEnabled) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!state.audioContext) {
    state.audioContext = new AudioContextClass();
  }

  const ctx = state.audioContext;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime;

  // モールス信号で一般的なトーンに寄せる。
  // 短点と長点は同じピッチ。長点は短点の約3倍。
  const preset = {
    press: { freq: 650, duration: 0.018, gain: 0.018, type: "sine" },
    dot: { freq: 650, duration: 0.075, gain: 0.07, type: "sine" },
    dash: { freq: 650, duration: 0.225, gain: 0.07, type: "sine" },
    confirm: { freq: 780, duration: 0.08, gain: 0.052, type: "sine" },
    correct: { freq: 780, duration: 0.08, gain: 0.055, type: "sine" },
    word: { freq: 900, duration: 0.11, gain: 0.055, type: "sine" },
    miss: { freq: 180, duration: 0.16, gain: 0.055, type: "sine" },
    delete: { freq: 420, duration: 0.055, gain: 0.038, type: "sine" },
    reset: { freq: 260, duration: 0.09, gain: 0.045, type: "sine" },
    toggle: { freq: 650, duration: 0.08, gain: 0.045, type: "sine" }
  }[type] || { freq: 650, duration: 0.08, gain: 0.045, type: "sine" };

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = preset.type;
  osc.frequency.setValueAtTime(preset.freq, now);

  // クリックノイズを避けるため、短いアタック/リリースを付ける。
  const attack = 0.006;
  const release = 0.018;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(preset.gain, now + attack);
  gain.gain.setValueAtTime(preset.gain, now + preset.duration);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.duration + release);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + preset.duration + release + 0.01);
}

function handleKeyboard(event) {
  if (state.screen === "classic") {
    if (event.key === ".") addClassicSymbol(".");
    if (event.key === "-") addClassicSymbol("-");
    if (event.key === "Backspace") deleteClassic();
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      confirmClassic();
    }
  }

  if (state.screen === "practice") {
    if (event.key === ".") addPracticeSymbol(".");
    if (event.key === "-") addPracticeSymbol("-");
    if (event.key === "Backspace") deletePractice();
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      confirmPractice();
    }
  }

  if (state.screen === "training") {
    if (event.key === "." || event.key.toLowerCase() === "j") addTrainingSymbol(".");
    if (event.key === "-" || event.key.toLowerCase() === "k") addTrainingSymbol("-");
    if (event.key === "Backspace") deleteTrainingInput();
    if (event.key === "Enter") { event.preventDefault(); chooseTrainingTarget(); }
  }

  if (state.screen === "game" && state.game) {
    if (event.key === ".") addGameSymbol(".");
    if (event.key === "-") addGameSymbol("-");
    if (event.key === "Backspace") deleteGameInput();
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      addGameSymbol("space");
    }
  }
}

/* Classic mode behavior: kept consistent with the accepted version. */
function addClassicSymbol(symbol) {
  ensureAudioContext();
  if (state.code.length >= INPUT_MAX_LENGTH + 1) {
    scheduleClassicExpire();
    playSe("miss");
    return;
  }

  state.code += symbol;
  updateClassic();

  if (state.code.length > INPUT_MAX_LENGTH) {
    scheduleClassicExpire();
    playSe("miss");
  }
}

function deleteClassic() {
  clearClassicExpire();
  state.code = state.code.slice(0, -1);
  playSe("delete");
  updateClassic();
}

function resetClassic() {
  clearClassicExpire();
  state.code = "";
  state.output = "";
  playSe("reset");
  updateClassic();
}

function confirmClassic() {
  if (!state.code) return;
  clearClassicExpire();
  state.output += CODE_TO_CHAR[state.code] || "?";
  playSe(CODE_TO_CHAR[state.code] ? "confirm" : "miss");
  state.code = "";
  updateClassic();
}

function scheduleClassicExpire() {
  clearClassicExpire();
  state.classicExpireTimer = setTimeout(() => {
    state.code = "";
    playSe("reset");
    updateClassic();
    flashElement(el.currentCode);
  }, INPUT_EXPIRE_MS);
}

function clearClassicExpire() {
  if (state.classicExpireTimer) {
    clearTimeout(state.classicExpireTimer);
    state.classicExpireTimer = null;
  }
}

function updateClassic() {
  el.currentCode.textContent = state.code ? toDisplayCode(state.code) : "未入力";
  el.currentLetter.textContent = state.code ? (CODE_TO_CHAR[state.code] || "?") : "-";
  el.outputText.textContent = state.output || "-";
  renderClassicBoard();
}

function renderClassicBoard() {
  renderBoardTo(el.morseBoard, state.code);
}

/* Practice mode */
function addPracticeSymbol(symbol) {
  ensureAudioContext();
  if (state.practice.code.length >= INPUT_MAX_LENGTH + 1) {
    schedulePracticeExpire();
    playSe("miss");
    return;
  }

  state.practice.code += symbol;
  updatePractice();

  if (state.practice.code.length > INPUT_MAX_LENGTH) {
    schedulePracticeExpire();
    playSe("miss");
  }
}

function deletePractice() {
  clearPracticeExpire();
  state.practice.code = state.practice.code.slice(0, -1);
  playSe("delete");
  updatePractice();
}

function resetPractice() {
  clearPracticeExpire();
  state.practice.code = "";
  state.practice.output = "";
  playSe("reset");
  updatePractice();
}

function confirmPractice() {
  if (!state.practice.code) return;
  clearPracticeExpire();
  state.practice.output += CODE_TO_CHAR[state.practice.code] || "?";
  playSe(CODE_TO_CHAR[state.practice.code] ? "confirm" : "miss");
  state.practice.code = "";
  updatePractice();
}

function schedulePracticeExpire() {
  clearPracticeExpire();
  state.practice.expireTimer = setTimeout(() => {
    state.practice.code = "";
    playSe("reset");
    updatePractice();
    flashElement(el.practiceCurrentCode);
  }, INPUT_EXPIRE_MS);
}

function clearPracticeExpire() {
  if (state.practice.expireTimer) {
    clearTimeout(state.practice.expireTimer);
    state.practice.expireTimer = null;
  }
}

function updatePractice() {
  const code = state.practice.code;
  el.practiceCurrentCode.textContent = code ? toDisplayCode(code) : "未入力";
  el.practiceCurrentLetter.textContent = code ? (CODE_TO_CHAR[code] || "?") : "-";
  el.practiceOutputText.textContent = state.practice.output || "-";
  renderBoardTo(el.practiceBoard, code);
}

/* Shared board renderer. It uses the same accepted board coordinates. */
function renderBoardTo(svg, activeCode = "") {
  svg.innerHTML = "";

  const defs = createSvg("defs");
  const gradient = createSvg("linearGradient", { id: `boardGradient-${svg.id}`, x1: "0", y1: "0", x2: "0", y2: "1" });
  gradient.appendChild(createSvg("stop", { offset: "0%", "stop-color": "#173155" }));
  gradient.appendChild(createSvg("stop", { offset: "100%", "stop-color": "#07111f" }));
  defs.appendChild(gradient);
  svg.appendChild(defs);

  svg.appendChild(createSvg("rect", { class: "board-bg", x: 12, y: 12, width: 936, height: 956, rx: 28, fill: `url(#boardGradient-${svg.id})` }));
  svg.appendChild(createSvg("rect", { class: "board-frame", x: 22, y: 22, width: 916, height: 936, rx: 22 }));

  svg.appendChild(text("MORSE", 98, 58, "board-title"));
  svg.appendChild(text("CODE", 360, 58, "board-title"));

  renderRoot(svg);

  BOARD_EDGES.forEach(edge => {
    const from = BOARD_NODES[edge.from];
    const to = BOARD_NODES[edge.to];
    if (!from || !to || from.x <= 0 || to.x <= 0) return;
    const active = activeCode && activeCode.startsWith(edge.to);
    svg.appendChild(createSvg("line", {
      class: `board-edge${active ? " path" : ""}`,
      x1: from.x, y1: from.y, x2: to.x, y2: to.y
    }));
  });

  Object.entries(BOARD_NODES).forEach(([code, node]) => {
    if (!code || node.x <= 0) return;
    renderNode(svg, code, node, activeCode);
  });

  DIGIT_POSITIONS.forEach(item => renderDigit(svg, item, activeCode));
}

function renderRoot(svg) {
  const group = createSvg("g", { class: "board-node root" });
  group.appendChild(createSvg("circle", { class: "node-shape", cx: 480, cy: 92, r: 28 }));
  group.appendChild(createSvg("path", { class: "antenna-line", d: "M462 78 L480 112 L498 78 M462 78 L498 78 M480 112 L480 143" }));
  svg.appendChild(group);
}

function renderNode(svg, code, node, activeCode) {
  const className = `board-node ${node.kind}${activeCode && activeCode.startsWith(code) ? " path" : ""}${activeCode === code ? " active" : ""}`;
  const group = createSvg("g", { class: className });

  if (node.kind === "dot") {
    group.appendChild(createSvg("circle", { class: "node-shape", cx: node.x, cy: node.y, r: nodeRadius(code) }));
  } else {
    const w = dashWidth(code);
    const h = dashHeight(code);
    group.appendChild(createSvg("rect", {
      class: "node-shape",
      x: node.x - w / 2,
      y: node.y - h / 2,
      width: w,
      height: h,
      rx: 4
    }));
  }

  svg.appendChild(group);

  if (node.label) {
    svg.appendChild(text(node.label, node.lx, node.ly, "board-node-label"));
  }
}

function renderDigit(svg, item, activeCode) {
  const className = `number-chip${activeCode && activeCode.startsWith(item.code) ? " path" : ""}${activeCode === item.code ? " current" : ""}`;
  const group = createSvg("g", { class: className });
  group.appendChild(createSvg("rect", { class: "number-chip-body", x: item.x - 42, y: item.y - 28, width: 84, height: 56, rx: 12 }));
  group.appendChild(text(item.char, item.x, item.y - 8, "number-chip-digit"));
  group.appendChild(text(toDisplayCode(item.code), item.x, item.y + 17, "number-chip-code"));
  svg.appendChild(group);
}

function nodeRadius(code) {
  if (code.length <= 2) return 27;
  if (code.length === 3) return 25;
  return 23;
}

function dashWidth(code) {
  if (code.length <= 2) return 78;
  if (code.length === 3) return 70;
  return 62;
}

function dashHeight(code) {
  if (code.length <= 2) return 38;
  if (code.length === 3) return 34;
  return 30;
}

function createSvg(name, attrs = {}) {
  const element = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function text(value, x, y, className) {
  const t = createSvg("text", { x, y, class: className });
  t.textContent = value;
  return t;
}

function toDisplayCode(code) {
  return code.replaceAll(".", "●").replaceAll("-", "■");
}

function flashElement(target) {
  if (!target) return;
  target.classList.remove("input-expire");
  void target.offsetWidth;
  target.classList.add("input-expire");
}

/* Training mode */
function setupTraining() {
  document.querySelectorAll("[data-training-mode]").forEach(button => button.addEventListener("click", () => setTrainingMode(button.dataset.trainingMode)));
  el.trainingLevelSelect.addEventListener("change", event => { state.training.level = event.target.value; chooseTrainingTarget(); });
  el.trainingDotButton.addEventListener("click", () => { playSe("dot"); addTrainingSymbol("."); });
  el.trainingDashButton.addEventListener("click", () => { playSe("dash"); addTrainingSymbol("-"); });
  setupPressButton(el.trainingKeyButton, addTrainingSymbol, null, el.trainingHoldBar, true);
  el.trainingResetButton.addEventListener("click", resetTrainingInput);
  el.trainingNextButton.addEventListener("click", chooseTrainingTarget);
  el.trainingLevelSelect.disabled = true;
}
function setTrainingMode(mode) {
  state.training.mode = mode;
  state.training.level = "basic";
  el.trainingLevelSelect.value = "basic";
  el.trainingLevelSelect.disabled = mode !== "kana";
  document.querySelectorAll("[data-training-mode]").forEach(button => button.classList.toggle("active", button.dataset.trainingMode === mode));
  chooseTrainingTarget();
}
function normalizeKana(char) { return SMALL_KANA_MAP[char] || char; }
function getKanaMorseParts(char) {
  const c = normalizeKana(char);
  if (KANA_MORSE[c]) return [{ label: c, code: KANA_MORSE[c], kind: "文字" }];
  if (KANA_DAKUTEN[c]) {
    const base = KANA_DAKUTEN[c][0];
    const mark = KANA_DAKUTEN[c][1];
    return [{ label: base, code: KANA_MORSE[base], kind: "清音" }, { label: "゛", code: mark, kind: "濁点" }];
  }
  if (KANA_HANDAKUTEN[c]) {
    const base = KANA_HANDAKUTEN[c][0];
    const mark = KANA_HANDAKUTEN[c][1];
    return [{ label: base, code: KANA_MORSE[base], kind: "清音" }, { label: "゜", code: mark, kind: "半濁点" }];
  }
  return [];
}
function getTrainingParts(char = state.training.target) {
  if (state.training.mode === "kana") return getKanaMorseParts(char);
  if (state.training.mode === "number") return [{ label: char, code: MORSE[char], kind: "数字" }];
  return [{ label: char, code: MORSE[char], kind: "英字" }];
}
function getTrainingCurrentPart() { return getTrainingParts()[state.training.partIndex] || null; }
function getTrainingPool() {
  if (state.training.mode === "number") return Object.keys(MORSE).filter(char => /^\d$/.test(char));
  if (state.training.mode === "kana") {
    if (state.training.level === "dakuten") return KANA_MARKED;
    if (state.training.level === "all") return [...KANA_BASIC, ...KANA_MARKED, "ー"];
    return KANA_BASIC;
  }
  return Object.keys(MORSE).filter(char => /^[A-Z]$/.test(char));
}
function chooseTrainingTarget() {
  const pool = getTrainingPool();
  if (!pool.length) return;
  let next = pool[Math.floor(Math.random() * pool.length)];
  while (pool.length > 1 && next === state.training.lastTarget) next = pool[Math.floor(Math.random() * pool.length)];
  state.training.target = next;
  state.training.lastTarget = next;
  state.training.partIndex = 0;
  state.training.input = "";
  state.training.wrong = false;
  setTrainingMessage("短音または長音を入力してください。", "");
  updateTraining();
}
function addTrainingSymbol(symbol) {
  ensureAudioContext();
  const current = getTrainingCurrentPart();
  if (!current || state.training.wrong) return;
  if (state.training.input.length >= current.code.length) return;
  state.training.input += symbol;
  if (!current.code.startsWith(state.training.input)) {
    state.training.wrong = true;
    state.training.misses += 1;
    state.training.streak = 0;
    playSe("miss");
    setTrainingMessage("誤入力です。リセットして再入力してください。", "bad");
    updateTraining();
    return;
  }
  if (state.training.input !== current.code) {
    setTrainingMessage("入力中です。現在の符号を最後まで入れてください。", "");
    updateTraining();
    return;
  }
  const parts = getTrainingParts();
  if (state.training.partIndex < parts.length - 1) {
    state.training.partIndex += 1;
    state.training.input = "";
    state.training.wrong = false;
    const nextPart = getTrainingCurrentPart();
    setTrainingMessage(`${nextPart.kind}「${nextPart.label}」を続けて入力してください。`, "");
    updateTraining();
    return;
  }
  state.training.correct += 1;
  state.training.streak += 1;
  playSe("correct");
  setTrainingMessage("正解です。次の問題へ進みます。", "good");
  updateTraining();
  setTimeout(() => { if (state.screen === "training") chooseTrainingTarget(); }, 520);
}
function deleteTrainingInput() {
  if (!state.training.input) return;
  state.training.input = state.training.input.slice(0, -1);
  state.training.wrong = false;
  playSe("delete");
  setTrainingMessage("1つ戻しました。", "");
  updateTraining();
}
function resetTrainingInput() {
  state.training.input = "";
  state.training.wrong = false;
  playSe("reset");
  setTrainingMessage("入力をリセットしました。", "");
  updateTraining();
}
function setTrainingMessage(message, kind = "") {
  el.trainingMessage.textContent = message;
  el.trainingMessage.className = `training-message${kind ? " " + kind : ""}`;
}
function updateTraining() {
  const parts = getTrainingParts();
  const current = getTrainingCurrentPart();
  const allCode = parts.map(part => toDisplayCode(part.code)).join(" / ");
  el.trainingTargetChar.textContent = state.training.target;
  el.trainingTargetSub.textContent = parts.length > 1 && current ? `${current.kind}: ${current.label} / ${toDisplayCode(current.code)}　全体: ${allCode}` : `${state.training.target} / ${allCode}`;
  el.trainingCurrentInput.textContent = state.training.input ? toDisplayCode(state.training.input) : "未入力";
  el.trainingOkCount.textContent = state.training.correct;
  el.trainingMissCount.textContent = state.training.misses;
  el.trainingStreakCount.textContent = state.training.streak;
  renderTrainingRouteMap(current ? current.code : "", state.training.input, state.training.wrong);
  renderTrainingCharGrid();
}
function renderTrainingRouteMap(targetCode, activeCode, wrong) {
  const container = el.trainingRouteMap;
  if (!container) return;
  container.innerHTML = "";
  if (!targetCode) return;
  const rect = container.getBoundingClientRect();
  const width = Math.max(rect.width || 520, 320);
  const height = Math.max(rect.height || 320, 240);
  const symbols = [...targetCode];
  const usableWidth = Math.max(width - 90, 220);
  const stepX = symbols.length ? usableWidth / symbols.length : usableWidth;
  const centerY = height * 0.5;
  const amp = Math.min(86, Math.max(42, height * 0.22));
  let y = centerY;
  const points = [{ x: 44, y: centerY, symbol: "root" }];
  symbols.forEach((symbol, index) => {
    const x = 44 + stepX * (index + 1);
    y += symbol === "." ? -amp / (index + 2) : amp / (index + 2);
    points.push({ x, y, symbol });
  });
  const svg = createSvg("svg", { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none" });
  for (let i = 0; i < points.length - 1; i += 1) {
    svg.appendChild(createSvg("line", { x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y, class: i < activeCode.length && !wrong ? "done" : "" }));
  }
  container.appendChild(svg);
  const wrongIndex = wrong ? Math.max(0, activeCode.length - 1) : -1;
  points.forEach((point, index) => {
    const node = document.createElement("div");
    node.className = "training-node";
    if (point.symbol === "root") {
      node.classList.add("root");
      node.textContent = "⌁";
    } else {
      const symbolIndex = index - 1;
      node.classList.add(point.symbol === "." ? "dot" : "dash");
      node.textContent = point.symbol === "." ? "●" : "■";
      if (symbolIndex < activeCode.length && !wrong) node.classList.add("done");
      if (symbolIndex === activeCode.length && !wrong) node.classList.add("active");
      if (symbolIndex === wrongIndex) node.classList.add("wrong");
    }
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
    container.appendChild(node);
  });
}
function renderTrainingCharGrid() {
  const pool = getTrainingPool();
  el.trainingCharGrid.innerHTML = "";
  pool.forEach(char => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `training-char-item${char === state.training.target ? " active" : ""}`;
    const code = getTrainingParts(char).map(part => toDisplayCode(part.code)).join("/");
    button.innerHTML = `<span class="char">${char}</span><span class="code">${code}</span>`;
    button.addEventListener("click", () => {
      state.training.target = char;
      state.training.lastTarget = char;
      state.training.partIndex = 0;
      state.training.input = "";
      state.training.wrong = false;
      setTrainingMessage("選択した文字で練習します。", "");
      updateTraining();
    });
    el.trainingCharGrid.appendChild(button);
  });
}

/* Game mode */
function showGameIntro() {
  stopGame();
  el.gameIntroPanel.classList.remove("hidden");
  el.gamePlayPanel.classList.add("hidden");
  el.gameResultPanel.classList.add("hidden");
  renderRanking();
}

function startGame() {
  ensureAudioContext();
  stopGame();
  state.game = {
    startedAt: performance.now(),
    raf: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    word: "",
    index: 0,
    input: "",
    lastInput: "",
    lastInputTimer: null,
    words: 0,
    chars: 0,
    misses: {},
    difficulty: "easy",
    level: 1,
    title: "Beginner",
    highestLevel: 1
  };

  el.gameIntroPanel.classList.add("hidden");
  el.gameResultPanel.classList.add("hidden");
  el.gamePlayPanel.classList.remove("hidden");

  if (el.gameEffectLayer) el.gameEffectLayer.innerHTML = "";
  nextWord();
  el.gameMessage.textContent = "入力してください。";
  el.gameMessage.className = "";
  tickGame();
}

function stopGame() {
  if (state.game?.raf) cancelAnimationFrame(state.game.raf);
  if (state.game?.lastInputTimer) clearTimeout(state.game.lastInputTimer);
  state.game = null;
}

function addGameSymbol(symbol) {
  ensureAudioContext();
  const game = state.game;
  if (!game) return;

  if (symbol !== "." && symbol !== "-") return;

  game.input += symbol;
  checkGameInput(false);
}

function clearGameInput() {
  if (!state.game) return;
  state.game.input = "";
  state.game.lastInput = "";
  playSe("reset");
  setGameMessage("入力をクリアしました。", "");
  updateGame();
}

function deleteGameInput() {
  if (!state.game) return;
  state.game.input = state.game.input.slice(0, -1);
  playSe("delete");
  setGameMessage(state.game.input ? "1つ戻しました。" : "入力を消しました。", "");
  updateGame();
}

function checkGameInput(fromSpace) {
  const game = state.game;
  if (!game) return;

  const target = game.word[game.index];
  const expected = MORSE[target];

  if (game.input === expected) {
    acceptGameCharacter(target);
    updateGame();
    return;
  }

  if (game.input.length > INPUT_MAX_LENGTH) {
    rejectGameCharacter(target, expected);
    updateGame();
    return;
  }

  setGameMessage("入力中。正解コードと一致すると自動で次へ進みます。", "");
  updateGame();
}

function rememberGameInput(code) {
  const game = state.game;
  if (!game) return;

  game.lastInput = code || "";
  if (game.lastInputTimer) clearTimeout(game.lastInputTimer);

  game.lastInputTimer = setTimeout(() => {
    if (!state.game) return;
    state.game.lastInput = "";
    updateGame();
  }, 700);
}

function acceptGameCharacter(target) {
  const game = state.game;
  const acceptedCode = game.input;
  rememberGameInput(acceptedCode);
  const gained = 10 + game.combo * 2;

  game.score += gained;
  game.combo += 1;
  game.maxCombo = Math.max(game.maxCombo, game.combo);
  game.chars += 1;
  game.index += 1;
  game.input = "";
  game.level = calculateLevel(game.combo, game.words);
  game.highestLevel = Math.max(game.highestLevel, game.level);
  game.title = calculateTitle(game.score, game.maxCombo);

  playSe("correct");
  setGameMessage(`正解：${target} +${gained}`, "good");
  showEffect(`+${gained} / ${game.combo} COMBO`, "good");
  pulseGameUi();

  if (game.index >= game.word.length) {
    clearGameWord();
  }
}

function clearGameWord() {
  const game = state.game;
  const difficulty = game.difficulty;
  const meta = DIFFICULTY_META[difficulty];
  const baseBonus = game.word.length * 20;
  const difficultyBonus = Math.round(baseBonus * meta.multiplier);
  const comboBonus = Math.max(0, game.combo - 1) * 5;
  const bonus = difficultyBonus + comboBonus;

  game.words += 1;
  game.score += bonus;
  game.level = calculateLevel(game.combo, game.words);
  game.highestLevel = Math.max(game.highestLevel, game.level);
  game.title = calculateTitle(game.score, game.maxCombo);

  playSe("word");
  setGameMessage(`単語クリア +${bonus}`, "good");
  showEffect(`${meta.label} CLEAR +${bonus}`, "level");

  setTimeout(() => {
    if (state.game) nextWord();
  }, 360);
}

function rejectGameCharacter(target, expected) {
  const game = state.game;
  rememberGameInput(game.input);
  game.combo = 0;
  game.misses[target] = (game.misses[target] || 0) + 1;
  game.input = "";
  game.level = calculateLevel(game.combo, game.words);
  game.title = calculateTitle(game.score, game.maxCombo);

  playSe("miss");
  setGameMessage(`ミス：${target} は ${toDisplayCode(expected)}`, "bad");
  showEffect("COMBO RESET", "bad");
}

function setGameMessage(message, kind = "") {
  if (!el.gameMessage) return;
  el.gameMessage.textContent = message;
  el.gameMessage.className = kind || "";
}

function nextWord() {
  const game = state.game;
  const level = calculateLevel(game.combo, game.words);
  game.level = level;
  game.highestLevel = Math.max(game.highestLevel, level);
  game.difficulty = difficultyForLevel(level);

  const pool = WORDS[game.difficulty];
  let word = pool[Math.floor(Math.random() * pool.length)];
  while (pool.length > 1 && word === game.word) {
    word = pool[Math.floor(Math.random() * pool.length)];
  }
  game.word = word;
  game.index = 0;
  game.input = "";
  updateGame();
}

function calculateLevel(combo, words) {
  if (combo >= 28 || words >= 10) return 5;
  if (combo >= 18 || words >= 7) return 4;
  if (combo >= 10 || words >= 4) return 3;
  if (combo >= 4 || words >= 2) return 2;
  return 1;
}

function difficultyForLevel(level) {
  if (level >= 5) return "master";
  if (level >= 4) return "expert";
  if (level >= 3) return "hard";
  if (level >= 2) return "normal";
  return "easy";
}

function calculateTitle(score, maxCombo) {
  let title = TITLES[0].title;
  for (const item of TITLES) {
    if (score >= item.min) title = item.title;
  }
  if (maxCombo >= 35) title = "Morse Ace";
  if (maxCombo >= 50) title = "Chief Operator";
  return title;
}

function tickGame() {
  const game = state.game;
  if (!game) return;

  const remain = Math.max(0, GAME_SECONDS - (performance.now() - game.startedAt) / 1000);
  el.gameTime.textContent = remain.toFixed(1);
  el.gameTimerBar.style.transform = `scaleX(${remain / GAME_SECONDS})`;

  if (remain <= 0) {
    endGame();
    return;
  }

  game.raf = requestAnimationFrame(tickGame);
}

function updateGame() {
  const game = state.game;
  if (!game) return;

  const target = game.word[game.index] || "";
  const expected = target ? MORSE[target] : "";
  const displayInput = game.input || game.lastInput || "";

  el.gameScore.textContent = game.score;
  el.gameCombo.textContent = game.combo;
  el.gameMaxCombo.textContent = game.maxCombo;
  el.gameLevel.textContent = `Lv.${game.level}`;
  el.gameTitle.textContent = game.title;
  el.gameDifficultyBadge.textContent = DIFFICULTY_META[game.difficulty].label;
  el.gameWord.textContent = game.word;
  el.gameCurrentLetter.textContent = target || "-";
  el.gameCurrentCode.textContent = displayInput ? toDisplayCode(displayInput) : "未入力";
  el.gameCurrentCode.classList.toggle("accepted-code", !game.input && !!game.lastInput);
  el.gameExpectedCode.textContent = expected ? toDisplayCode(expected) : "-";
  el.gameLastInputCode.textContent = game.lastInput ? toDisplayCode(game.lastInput) : "-";

  renderInputSymbols(displayInput, !game.input && !!game.lastInput);
  updateInputStatus(game.input, expected, game.lastInput);

  el.gameWordProgress.innerHTML = "";
  [...game.word].forEach((char, index) => {
    const token = document.createElement("span");
    token.className = "game-token";
    if (index < game.index) token.classList.add("done");
    if (index === game.index) token.classList.add("current");
    token.textContent = char;
    el.gameWordProgress.appendChild(token);
  });

  renderBoardTo(el.gameBoard, game.input);
}

function renderInputSymbols(code, accepted = false) {
  if (!el.gameInputDots) return;
  el.gameInputDots.innerHTML = "";

  if (!code) {
    const empty = document.createElement("span");
    empty.className = "label";
    empty.textContent = "まだ入力されていません";
    el.gameInputDots.appendChild(empty);
    return;
  }

  [...code].forEach(symbol => {
    const item = document.createElement("span");
    item.className = `input-symbol ${symbol === "." ? "dot" : "dash"}${accepted ? " accepted" : ""}`;
    item.textContent = symbol === "." ? "●" : "■";
    el.gameInputDots.appendChild(item);
  });
}

function updateInputStatus(input, expected, lastInput = "") {
  const panel = document.querySelector(".game-current");
  if (!panel) return;

  panel.classList.remove("input-active", "input-wrong", "ready-match");

  if (!input && lastInput) {
    panel.classList.add("ready-match");
    return;
  }

  if (!input) return;

  if (input === expected) {
    panel.classList.add("ready-match");
    return;
  }

  panel.classList.add("input-active");

  if (input.length >= expected.length && input !== expected) {
    panel.classList.add("input-wrong");
  }
}

function endGame() {
  const game = state.game;
  if (!game) return;
  if (game.raf) cancelAnimationFrame(game.raf);

  const record = {
    score: game.score,
    words: game.words,
    chars: game.chars,
    maxCombo: game.maxCombo,
    level: game.highestLevel,
    title: calculateTitle(game.score, game.maxCombo),
    misses: { ...game.misses },
    date: new Date().toLocaleDateString("ja-JP")
  };

  saveRanking(record);
  renderResult(record);
  state.game = null;

  el.gamePlayPanel.classList.add("hidden");
  el.gameIntroPanel.classList.add("hidden");
  el.gameResultPanel.classList.remove("hidden");
  renderRanking();
}

function showEffect(text, kind = "good") {
  if (!el.gameEffectLayer) return;
  const item = document.createElement("div");
  item.className = `game-effect ${kind}`;
  item.textContent = text;
  el.gameEffectLayer.appendChild(item);
  setTimeout(() => item.remove(), 1100);
}

function pulseGameUi() {
  const targets = [
    document.querySelector(".game-word-wrap"),
    document.querySelector(".game-current")
  ].filter(Boolean);

  targets.forEach(target => {
    target.classList.remove("combo-pulse");
    void target.offsetWidth;
    target.classList.add("combo-pulse");
  });
}

function renderResult(record) {
  el.resultScore.textContent = record.score;
  el.resultWords.textContent = record.words;
  el.resultChars.textContent = record.chars;
  el.resultMaxCombo.textContent = record.maxCombo;
  el.resultLevel.textContent = `Lv.${record.level || 1}`;
  el.resultTitle.textContent = record.title || calculateTitle(record.score, record.maxCombo || 0);

  const weak = Object.entries(record.misses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([letter, count]) => `${letter}（${count}回）`);

  el.resultWeakLetters.textContent = weak.length ? `苦手文字：${weak.join("、")}` : "苦手文字：なし";
}

function saveRanking(record) {
  const ranking = loadRanking();
  ranking.push(record);
  ranking.sort((a, b) => b.score - a.score);
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking.slice(0, 5)));
}

function loadRanking() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RANKING_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderRanking() {
  const ranking = loadRanking();
  el.rankingList.innerHTML = "";
  if (!ranking.length) {
    const li = document.createElement("li");
    li.textContent = "まだ記録がありません";
    el.rankingList.appendChild(li);
    return;
  }
  ranking.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.score}点 / ${item.words}語 / 最大${item.maxCombo}コンボ / ${item.title || "Beginner"} / ${item.date}`;
    el.rankingList.appendChild(li);
  });
}
