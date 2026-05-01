const NS = "http://www.w3.org/2000/svg";
const LONG_PRESS_MS = 300;
const GAME_SECONDS = 40;
const RANKING_KEY = "morseClassicGameRanking";

const MORSE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----."
};
const CODE_TO_CHAR = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

const WORDS = {
  easy: ["IT", "ON", "GO", "UP", "NO", "CAT", "DOG", "SUN"],
  normal: ["CODE", "WAVE", "RADIO", "LIGHT", "TRAIN", "MOON"],
  hard: ["MORSE", "SIGNAL", "BEACON", "STATION", "PLANET"],
  expert: ["TELEGRAM", "WIRELESS", "SIGNAL7", "RADIO5", "BEACON9"]
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

  "----": { x: 46, y: 150, kind: "dash", label: "Q", lx: 40, ly: 228 },
  "---.": { x: 265, y: 430, kind: "dot", label: "Z", lx: 315, ly: 430 },
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
  meterRaf: null,
  practice: {
    code: "",
    output: ""
  },
  game: null
};

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  [
    "modeScreen", "classicScreen", "practiceScreen", "gameScreen",
    "classicModeButton", "practiceModeButton", "gameModeButton",
    "classicBackButton", "practiceBackButton", "gameBackButton",

    "currentCode", "currentLetter", "outputText", "timeBar", "morseBoard",
    "keyButton", "spaceButton", "deleteButton", "resetButton",

    "practiceCurrentCode", "practiceCurrentLetter", "practiceOutputText", "practiceBoard",
    "practiceKeyButton", "practiceSpaceButton", "practiceDeleteButton", "practiceResetButton",

    "gameIntroPanel", "gamePlayPanel", "gameResultPanel",
    "startGameButton", "playAgainButton", "backToGameIntroButton",
    "gameKeyButton", "gameSpaceButton", "gameDeleteButton", "gameQuitButton",
    "gameTime", "gameTimerBar", "gameScore", "gameCombo", "gameMaxCombo",
    "gameWord", "gameWordProgress", "gameCurrentLetter", "gameCurrentCode", "gameMessage", "gameBoard",
    "resultScore", "resultWords", "resultChars", "resultMaxCombo", "resultWeakLetters",
    "rankingList"
  ].forEach(id => el[id] = document.getElementById(id));

  el.classicModeButton.addEventListener("click", () => showScreen("classic"));
  el.practiceModeButton.addEventListener("click", () => showScreen("practice"));
  el.gameModeButton.addEventListener("click", () => showScreen("game"));

  el.classicBackButton.addEventListener("click", () => showScreen("mode"));
  el.practiceBackButton.addEventListener("click", () => showScreen("mode"));
  el.gameBackButton.addEventListener("click", () => {
    stopGame();
    showScreen("mode");
  });

  setupPressButton(el.keyButton, addClassicSymbol, el.timeBar);
  el.spaceButton.addEventListener("click", confirmClassic);
  el.deleteButton.addEventListener("click", deleteClassic);
  el.resetButton.addEventListener("click", resetClassic);

  setupPressButton(el.practiceKeyButton, addPracticeSymbol, null);
  el.practiceSpaceButton.addEventListener("click", confirmPractice);
  el.practiceDeleteButton.addEventListener("click", deletePractice);
  el.practiceResetButton.addEventListener("click", resetPractice);

  setupPressButton(el.gameKeyButton, addGameSymbol, null);
  el.gameSpaceButton.addEventListener("click", () => addGameSymbol("space"));
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
  showGameIntro();
  renderRanking();
});

function showScreen(screen) {
  state.screen = screen;
  el.modeScreen.classList.toggle("hidden", screen !== "mode");
  el.classicScreen.classList.toggle("hidden", screen !== "classic");
  el.practiceScreen.classList.toggle("hidden", screen !== "practice");
  el.gameScreen.classList.toggle("hidden", screen !== "game");

  if (screen === "classic") {
    renderClassicBoard();
    updateClassic();
  }
  if (screen === "practice") {
    updatePractice();
  }
  if (screen === "game") {
    showGameIntro();
    renderRanking();
  }
}

function setupPressButton(button, callback, meter) {
  let startAt = 0;
  let active = FalseValue();

  const start = event => {
    event.preventDefault();
    active = true;
    startAt = performance.now();
    button.classList.add("pressing");
    if (meter) updateMeter(meter, startAt);
  };

  const finish = event => {
    if (!active) return;
    event.preventDefault();
    active = false;
    button.classList.remove("pressing");
    if (state.meterRaf) cancelAnimationFrame(state.meterRaf);
    if (meter) meter.style.width = "0%";
    const elapsed = performance.now() - startAt;
    callback(elapsed >= LONG_PRESS_MS ? "-" : ".");
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", finish);
  button.addEventListener("pointerleave", finish);
  button.addEventListener("pointercancel", finish);
}

function FalseValue() {
  return false;
}

function updateMeter(meter, startAt) {
  const elapsed = performance.now() - startAt;
  const pct = Math.min(100, elapsed / LONG_PRESS_MS * 100);
  meter.style.width = `${pct}%`;
  state.meterRaf = requestAnimationFrame(() => updateMeter(meter, startAt));
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
  if (state.code.length >= 5) return;
  state.code += symbol;
  updateClassic();
}

function deleteClassic() {
  state.code = state.code.slice(0, -1);
  updateClassic();
}

function resetClassic() {
  state.code = "";
  state.output = "";
  updateClassic();
}

function confirmClassic() {
  if (!state.code) return;
  state.output += CODE_TO_CHAR[state.code] || "?";
  state.code = "";
  updateClassic();
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
  if (state.practice.code.length >= 5) return;
  state.practice.code += symbol;
  updatePractice();
}

function deletePractice() {
  state.practice.code = state.practice.code.slice(0, -1);
  updatePractice();
}

function resetPractice() {
  state.practice.code = "";
  state.practice.output = "";
  updatePractice();
}

function confirmPractice() {
  if (!state.practice.code) return;
  state.practice.output += CODE_TO_CHAR[state.practice.code] || "?";
  state.practice.code = "";
  updatePractice();
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

/* Game mode */
function showGameIntro() {
  stopGame();
  el.gameIntroPanel.classList.remove("hidden");
  el.gamePlayPanel.classList.add("hidden");
  el.gameResultPanel.classList.add("hidden");
  renderRanking();
}

function startGame() {
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
    words: 0,
    chars: 0,
    misses: {}
  };

  el.gameIntroPanel.classList.add("hidden");
  el.gameResultPanel.classList.add("hidden");
  el.gamePlayPanel.classList.remove("hidden");

  nextWord();
  el.gameMessage.textContent = "入力してください。";
  el.gameMessage.className = "";
  tickGame();
}

function stopGame() {
  if (state.game?.raf) cancelAnimationFrame(state.game.raf);
  state.game = null;
}

function addGameSymbol(symbol) {
  const game = state.game;
  if (!game) return;

  if (symbol === "space") {
    checkGameInput(true);
    return;
  }

  if (game.input.length >= 5) return;
  game.input += symbol;
  checkGameInput(false);
}

function deleteGameInput() {
  if (!state.game) return;
  state.game.input = state.game.input.slice(0, -1);
  updateGame();
}

function checkGameInput(fromSpace) {
  const game = state.game;
  const target = game.word[game.index];
  const expected = MORSE[target];

  if (game.input === expected) {
    const gained = 10 + game.combo * 2;
    game.score += gained;
    game.combo += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    game.chars += 1;
    game.index += 1;
    game.input = "";
    setGameMessage(`正解：${target} +${gained}`, "good");

    if (game.index >= game.word.length) {
      const bonus = game.word.length * 20 + Math.max(0, game.combo - 1) * 5;
      game.words += 1;
      game.score += bonus;
      setGameMessage(`単語クリア +${bonus}`, "good");
      setTimeout(() => {
        if (state.game) nextWord();
      }, 280);
    }
  } else if (
    fromSpace ||
    !expected.startsWith(game.input) ||
    game.input.length >= expected.length
  ) {
    game.combo = 0;
    game.misses[target] = (game.misses[target] || 0) + 1;
    game.input = "";
    setGameMessage(`ミス：${target} は ${toDisplayCode(expected)}`, "bad");
  }

  updateGame();
}

function setGameMessage(message, kind) {
  el.gameMessage.textContent = message;
  el.gameMessage.className = kind || "";
}

function nextWord() {
  const game = state.game;
  const level = game.words >= 8 ? "expert" : game.words >= 5 ? "hard" : game.words >= 2 ? "normal" : "easy";
  const pool = WORDS[level];
  let word = pool[Math.floor(Math.random() * pool.length)];
  while (pool.length > 1 && word === game.word) {
    word = pool[Math.floor(Math.random() * pool.length)];
  }
  game.word = word;
  game.index = 0;
  game.input = "";
  updateGame();
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

  el.gameScore.textContent = game.score;
  el.gameCombo.textContent = game.combo;
  el.gameMaxCombo.textContent = game.maxCombo;
  el.gameWord.textContent = game.word;
  el.gameCurrentLetter.textContent = game.word[game.index] || "-";
  el.gameCurrentCode.textContent = game.input ? toDisplayCode(game.input) : "未入力";

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

function endGame() {
  const game = state.game;
  if (!game) return;
  if (game.raf) cancelAnimationFrame(game.raf);

  const record = {
    score: game.score,
    words: game.words,
    chars: game.chars,
    maxCombo: game.maxCombo,
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

function renderResult(record) {
  el.resultScore.textContent = record.score;
  el.resultWords.textContent = record.words;
  el.resultChars.textContent = record.chars;
  el.resultMaxCombo.textContent = record.maxCombo;

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
    li.textContent = `${item.score}点 / ${item.words}語 / 最大${item.maxCombo}コンボ / ${item.date}`;
    el.rankingList.appendChild(li);
  });
}
