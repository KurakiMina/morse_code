const MORSE_TABLE = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.",
  H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.",
  O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-",
  V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----."
};

const CODE_TO_CHAR = Object.fromEntries(Object.entries(MORSE_TABLE).map(([k, v]) => [v, k]));

const WORDS = {
  easy: ["IT", "ON", "GO", "UP", "AM", "NO", "TO", "CAT", "DOG", "SUN", "SKY", "SEA"],
  normal: ["CODE", "WAVE", "SIGN", "RADIO", "LIGHT", "TRAIN", "BIRD", "MOON"],
  hard: ["MORSE", "SIGNAL", "BEACON", "STATION", "PILOT", "ROCKET", "PLANET"],
  expert: ["TELEGRAM", "WIRELESS", "OPERATOR", "SIGNAL7", "RADIO5", "BEACON9"]
};

const GAME_SECONDS = 40;
const LONG_PRESS_MS = 280;
const RANKING_KEY = "morseGameRankingV1";

const state = {
  screen: "modeScreen",
  sound: true,
  practiceSequence: "",
  practiceHistory: [],
  classicSequence: "",
  classicHistory: [],
  game: null,
  audioContext: null
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  setupModeNavigation();
  setupPractice();
  setupClassic();
  setupGame();
  renderMorseMap("practiceMorseMap", "");
  renderMorseMap("classicMorseMap", "");
  renderMorseMap("gameMorseMap", "");
  showScreen("modeScreen");
});

function bindElements() {
  [
    "modeScreen", "classicScreen", "practiceScreen", "gameIntroScreen", "gameScreen", "resultScreen",
    "soundToggle", "classicModeBtn", "practiceModeBtn", "gameModeBtn", "startGameBtn",

    "classicPressZone", "classicPressLabel", "classicHoldBar", "classicDotBtn", "classicDashBtn",
    "classicConfirmBtn", "classicResetBtn", "classicSequence", "classicResult", "classicHistory",

    "practicePressZone", "practicePressLabel", "practiceHoldBar", "practiceDotBtn", "practiceDashBtn",
    "practiceConfirmBtn", "practiceResetBtn", "practiceSequence", "practiceResult", "practiceHistory",

    "gamePressZone", "gamePressLabel", "gameHoldBar", "gameDotBtn", "gameDashBtn", "gameSequence",
    "gameClearInputBtn", "quitGameBtn", "timeLeft", "timerBar", "score", "combo", "level",
    "targetWord", "wordProgress", "currentChar", "gameMessage", "maxCombo",
    "finalScore", "finalWords", "finalChars", "finalMaxCombo", "weakLetters", "rankingList",
    "newRecordBadge", "playAgainBtn"
  ].forEach(id => els[id] = document.getElementById(id));
}

function setupModeNavigation() {
  els.classicModeBtn.addEventListener("click", () => {
    resetClassic();
    showScreen("classicScreen");
  });

  els.practiceModeBtn.addEventListener("click", () => {
    resetPractice();
    showScreen("practiceScreen");
  });

  els.gameModeBtn.addEventListener("click", () => showScreen("gameIntroScreen"));

  document.querySelectorAll(".backToMenu").forEach(button => {
    button.addEventListener("click", () => {
      stopGame();
      showScreen("modeScreen");
    });
  });

  els.soundToggle.addEventListener("click", () => {
    state.sound = !state.sound;
    els.soundToggle.textContent = state.sound ? "音あり" : "音なし";
    els.soundToggle.setAttribute("aria-pressed", String(state.sound));
  });
}

function setupClassic() {
  makePressInput(els.classicPressZone, els.classicHoldBar, (symbol) => addClassicSymbol(symbol));
  els.classicDotBtn.addEventListener("click", () => addClassicSymbol("."));
  els.classicDashBtn.addEventListener("click", () => addClassicSymbol("-"));
  els.classicConfirmBtn.addEventListener("click", confirmClassicChar);
  els.classicResetBtn.addEventListener("click", resetClassic);
}

function setupPractice() {
  makePressInput(els.practicePressZone, els.practiceHoldBar, (symbol) => addPracticeSymbol(symbol));
  els.practiceDotBtn.addEventListener("click", () => addPracticeSymbol("."));
  els.practiceDashBtn.addEventListener("click", () => addPracticeSymbol("-"));
  els.practiceConfirmBtn.addEventListener("click", confirmPracticeChar);
  els.practiceResetBtn.addEventListener("click", resetPractice);
}

function setupGame() {
  makePressInput(els.gamePressZone, els.gameHoldBar, (symbol) => addGameSymbol(symbol));
  els.gameDotBtn.addEventListener("click", () => addGameSymbol("."));
  els.gameDashBtn.addEventListener("click", () => addGameSymbol("-"));
  els.gameClearInputBtn.addEventListener("click", clearGameInput);
  els.quitGameBtn.addEventListener("click", () => endGame());
  els.startGameBtn.addEventListener("click", startGame);
  els.playAgainBtn.addEventListener("click", startGame);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
  els[id].classList.add("active");
  state.screen = id;
}

function makePressInput(zone, bar, onInput) {
  let downAt = 0;
  let rafId = null;
  let pointerActive = false;

  const start = (event) => {
    event.preventDefault();
    pointerActive = true;
    downAt = performance.now();
    zone.classList.add("pressing");
    updateHoldBar();
  };

  const finish = (event) => {
    if (!pointerActive) return;
    event.preventDefault();
    pointerActive = false;
    zone.classList.remove("pressing");
    cancelAnimationFrame(rafId);
    bar.style.height = "0%";
    const elapsed = performance.now() - downAt;
    onInput(elapsed >= LONG_PRESS_MS ? "-" : ".");
  };

  const updateHoldBar = () => {
    const elapsed = performance.now() - downAt;
    const pct = Math.min(100, (elapsed / LONG_PRESS_MS) * 100);
    bar.style.height = `${pct}%`;
    rafId = requestAnimationFrame(updateHoldBar);
  };

  zone.addEventListener("pointerdown", start);
  zone.addEventListener("pointerup", finish);
  zone.addEventListener("pointercancel", finish);
  zone.addEventListener("pointerleave", finish);

  zone.addEventListener("keydown", (event) => {
    if (event.key === "." || event.key === "ArrowLeft") onInput(".");
    if (event.key === "-" || event.key === "ArrowRight") onInput("-");
    if (event.code === "Space") {
      event.preventDefault();
      if (!pointerActive) start(event);
    }
  });

  zone.addEventListener("keyup", (event) => {
    if (event.code === "Space") finish(event);
  });
}

function addClassicSymbol(symbol) {
  if (state.classicSequence.length >= 6) {
    flashMessage(els.classicResult, "6入力まで対応");
    playTone("bad");
    return;
  }

  state.classicSequence += symbol;
  playTone(symbol === "." ? "dot" : "dash");
  renderClassic();
}

function renderClassic() {
  const seq = state.classicSequence;
  els.classicSequence.textContent = seq ? formatMorse(seq) : "未入力";
  els.classicResult.textContent = seq ? (CODE_TO_CHAR[seq] || "未確定") : "-";
  renderMorseMap("classicMorseMap", seq);
}

function confirmClassicChar() {
  const seq = state.classicSequence;
  if (!seq) return;

  const char = CODE_TO_CHAR[seq];
  if (!char) {
    flashMessage(els.classicResult, "該当なし");
    playTone("bad");
    return;
  }

  state.classicHistory.push(char);
  els.classicHistory.textContent = state.classicHistory.join("");
  state.classicSequence = "";
  playTone("good");
  renderClassic();
}

function resetClassic() {
  state.classicSequence = "";
  state.classicHistory = [];
  els.classicHistory.textContent = "まだありません";
  renderClassic();
}

function addPracticeSymbol(symbol) {
  if (state.practiceSequence.length >= 6) {
    flashMessage(els.practiceResult, "6入力まで対応");
    playTone("bad");
    return;
  }

  state.practiceSequence += symbol;
  playTone(symbol === "." ? "dot" : "dash");
  renderPractice();
}

function renderPractice() {
  const seq = state.practiceSequence;
  els.practiceSequence.textContent = seq ? formatMorse(seq) : "未入力";
  els.practiceResult.textContent = seq ? (CODE_TO_CHAR[seq] || "未確定") : "-";
  renderMorseMap("practiceMorseMap", seq);
}

function confirmPracticeChar() {
  const seq = state.practiceSequence;
  if (!seq) return;

  const char = CODE_TO_CHAR[seq];
  if (!char) {
    flashMessage(els.practiceResult, "該当なし");
    playTone("bad");
    return;
  }

  state.practiceHistory.push(char);
  els.practiceHistory.textContent = state.practiceHistory.join("");
  state.practiceSequence = "";
  playTone("good");
  renderPractice();
}

function resetPractice() {
  state.practiceSequence = "";
  state.practiceHistory = [];
  els.practiceHistory.textContent = "まだありません";
  renderPractice();
}

function startGame() {
  stopGame();

  state.game = {
    startedAt: performance.now(),
    remaining: GAME_SECONDS,
    timerId: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correctWords: 0,
    correctChars: 0,
    currentWord: "",
    currentIndex: 0,
    input: "",
    level: 1,
    misses: {}
  };

  showScreen("gameScreen");
  nextWord();
  updateGameUI();
  state.game.timerId = requestAnimationFrame(tickGame);
}

function stopGame() {
  if (state.game?.timerId) cancelAnimationFrame(state.game.timerId);
  state.game = null;
}

function tickGame() {
  const game = state.game;
  if (!game) return;

  const elapsed = (performance.now() - game.startedAt) / 1000;
  game.remaining = Math.max(0, GAME_SECONDS - elapsed);
  updateTimerUI();

  if (game.remaining <= 0) {
    endGame();
    return;
  }

  game.timerId = requestAnimationFrame(tickGame);
}

function endGame() {
  const game = state.game;
  if (!game) return;

  if (game.timerId) cancelAnimationFrame(game.timerId);

  const result = {
    score: game.score,
    words: game.correctWords,
    chars: game.correctChars,
    maxCombo: game.maxCombo,
    misses: {...game.misses},
    date: new Date().toLocaleDateString("ja-JP")
  };

  const wasRecord = saveRanking(result);
  renderResult(result, wasRecord);
  state.game = null;
  showScreen("resultScreen");
}

function addGameSymbol(symbol) {
  const game = state.game;
  if (!game) return;

  if (game.input.length >= 6) {
    handleGameMiss("入力が長すぎます");
    return;
  }

  game.input += symbol;
  playTone(symbol === "." ? "dot" : "dash");
  updateGameUI();

  const targetChar = getTargetChar();
  const expected = MORSE_TABLE[targetChar];

  if (game.input === expected) {
    handleGameCorrectChar();
    return;
  }

  const possible = expected.startsWith(game.input);
  if (!possible || game.input.length >= expected.length) {
    handleGameMiss(`${targetChar} は ${formatMorse(expected)} です`);
  }
}

function handleGameCorrectChar() {
  const game = state.game;
  const targetChar = getTargetChar();

  game.correctChars += 1;
  game.combo += 1;
  game.maxCombo = Math.max(game.maxCombo, game.combo);

  const comboBonus = game.combo * 2;
  game.score += 10 + comboBonus;

  game.currentIndex += 1;
  game.input = "";

  setGameMessage(`正解：${targetChar} +${10 + comboBonus}`, "good");
  playTone("good");

  if (game.currentIndex >= game.currentWord.length) {
    clearWord();
  }

  updateGameUI();
}

function handleGameMiss(message) {
  const game = state.game;
  const targetChar = getTargetChar();

  if (targetChar) {
    game.misses[targetChar] = (game.misses[targetChar] || 0) + 1;
  }

  game.combo = 0;
  game.input = "";
  setGameMessage(`ミス：${message}。もう一度入力してください。`, "bad");
  playTone("bad");
  updateGameUI();
}

function clearWord() {
  const game = state.game;
  const difficulty = getDifficulty(game.level);
  const multiplier = getDifficultyMultiplier(difficulty);
  const wordBonus = Math.round(game.currentWord.length * 20 * multiplier);
  const streakBonus = game.combo >= 5 ? game.combo * 5 : 0;

  game.score += wordBonus + streakBonus;
  game.correctWords += 1;

  setGameMessage(`単語クリア +${wordBonus + streakBonus}`, "good");
  game.level = calculateLevel(game.correctWords, game.maxCombo);

  setTimeout(() => {
    if (state.game) nextWord();
  }, 360);
}

function nextWord() {
  const game = state.game;
  const difficulty = getDifficulty(game.level);
  const pool = WORDS[difficulty];
  let next = pool[Math.floor(Math.random() * pool.length)];

  if (pool.length > 1) {
    while (next === game.currentWord) {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
  }

  game.currentWord = next;
  game.currentIndex = 0;
  game.input = "";
  setGameMessage("入力してください", "");
  updateGameUI();
}

function clearGameInput() {
  if (!state.game) return;
  state.game.input = "";
  setGameMessage("入力をリセットしました", "");
  updateGameUI();
}

function getTargetChar() {
  const game = state.game;
  return game?.currentWord?.[game.currentIndex] || "";
}

function calculateLevel(correctWords, maxCombo) {
  if (correctWords >= 9 || maxCombo >= 25) return 5;
  if (correctWords >= 6 || maxCombo >= 16) return 4;
  if (correctWords >= 3 || maxCombo >= 9) return 3;
  if (correctWords >= 1 || maxCombo >= 4) return 2;
  return 1;
}

function getDifficulty(level) {
  if (level >= 5) return "expert";
  if (level >= 4) return "hard";
  if (level >= 2) return "normal";
  return "easy";
}

function getDifficultyMultiplier(difficulty) {
  return {
    easy: 1,
    normal: 1.2,
    hard: 1.5,
    expert: 2
  }[difficulty] || 1;
}

function updateGameUI() {
  const game = state.game;
  if (!game) return;

  els.score.textContent = game.score;
  els.combo.textContent = game.combo;
  els.maxCombo.textContent = game.maxCombo;
  els.level.textContent = `Lv.${game.level}`;
  els.targetWord.textContent = game.currentWord;
  els.currentChar.textContent = getTargetChar() || "-";
  els.gameSequence.textContent = game.input ? formatMorse(game.input) : "未入力";

  renderWordProgress();
  renderMorseMap("gameMorseMap", game.input, MORSE_TABLE[getTargetChar()]);
  updateTimerUI();
}

function updateTimerUI() {
  const game = state.game;
  if (!game) return;
  els.timeLeft.textContent = game.remaining.toFixed(1);
  els.timerBar.style.transform = `scaleX(${game.remaining / GAME_SECONDS})`;
}

function renderWordProgress() {
  const game = state.game;
  els.wordProgress.innerHTML = "";

  [...game.currentWord].forEach((char, index) => {
    const token = document.createElement("span");
    token.className = "word-token";
    token.textContent = char;

    if (index < game.currentIndex) token.classList.add("done");
    if (index === game.currentIndex) token.classList.add("current");

    els.wordProgress.appendChild(token);
  });
}

function setGameMessage(text, type) {
  els.gameMessage.textContent = text;
  els.gameMessage.className = type || "";
  els.gameMessage.classList.remove("feedback-pop");
  void els.gameMessage.offsetWidth;
  els.gameMessage.classList.add("feedback-pop");
}

function renderResult(result, wasRecord) {
  els.finalScore.textContent = result.score;
  els.finalWords.textContent = result.words;
  els.finalChars.textContent = result.chars;
  els.finalMaxCombo.textContent = result.maxCombo;

  const misses = Object.entries(result.misses).sort((a, b) => b[1] - a[1]).slice(0, 5);
  els.weakLetters.textContent = misses.length
    ? misses.map(([char, count]) => `${char}（${count}回）`).join("、")
    : "ミスはありませんでした。";

  els.newRecordBadge.classList.toggle("hidden", !wasRecord);
  renderRanking();
}

function saveRanking(result) {
  const current = loadRanking();
  const beforeBest = current[0]?.score ?? -1;
  const next = [...current, result]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  localStorage.setItem(RANKING_KEY, JSON.stringify(next));
  return result.score > beforeBest || current.length === 0;
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
  els.rankingList.innerHTML = "";

  if (!ranking.length) {
    const li = document.createElement("li");
    li.textContent = "まだ記録がありません";
    els.rankingList.appendChild(li);
    return;
  }

  ranking.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.score}点 / ${item.words}語 / 最大${item.maxCombo}コンボ / ${item.date}`;
    els.rankingList.appendChild(li);
  });
}

function renderMorseMap(containerId, activeSequence = "", guideSequence = "") {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  const maxDepth = 5;
  const nodes = [{ code: "", label: "⌁", x: 50, y: 6, type: "root", parent: null, depth: 0 }];

  // 縦長・互い違い配置。
  // 深い段ほど横方向を圧縮し、奇数番目を上下にずらすことで5段目の重なりを避ける。
  const yBase = { 1: 18, 2: 34, 3: 51, 4: 69, 5: 88 };
  const widths = { 1: 38, 2: 58, 3: 72, 4: 84, 5: 90 };

  for (let depth = 1; depth <= maxDepth; depth++) {
    const count = 2 ** depth;
    const spread = widths[depth];
    const left = 50 - spread / 2;
    const step = spread / (count - 1 || 1);

    for (let index = 0; index < count; index++) {
      const bits = index.toString(2).padStart(depth, "0");
      const code = [...bits].map(bit => bit === "0" ? "." : "-").join("");
      const parentCode = code.slice(0, -1);
      let x = count === 1 ? 50 : left + index * step;

      // 深い階層は互い違いにする。横に並べすぎず、視認性を優先。
      let y = yBase[depth];
      if (depth >= 4) {
        y += index % 2 === 0 ? -1.8 : 1.8;
      }
      if (depth === 5) {
        y += index % 4 < 2 ? -1.8 : 1.8;
      }

      const char = CODE_TO_CHAR[code] || "";
      const type = code.endsWith(".") ? "dot" : "dash";

      nodes.push({ code, label: char, x, y, type, parent: parentCode, depth });
    }
  }

  const byCode = new Map(nodes.map(node => [node.code, node]));
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");

  nodes.filter(node => node.parent !== null).forEach(node => {
    const parent = byCode.get(node.parent);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", parent.x);
    line.setAttribute("y1", parent.y);
    line.setAttribute("x2", node.x);
    line.setAttribute("y2", node.y);
    line.setAttribute("class", isPathEdgeActive(activeSequence, node.code) ? "map-line active" : "map-line");
    svg.appendChild(line);
  });

  container.appendChild(svg);

  nodes.forEach(node => {
    const div = document.createElement("div");
    div.className = `map-node ${node.type} depth-${node.depth}`;
    div.style.left = `${node.x}%`;
    div.style.top = `${node.y}%`;
    div.textContent = node.label || "";

    if (node.code === "") {
      div.classList.add("root");
      div.textContent = "⌁";
    }

    if (node.code && activeSequence.startsWith(node.code)) {
      div.classList.add("active");
    }

    if (node.code && node.code === activeSequence) {
      div.classList.add(CODE_TO_CHAR[node.code] ? "solved" : "current");
    }

    if (node.code && guideSequence && guideSequence.startsWith(node.code) && !activeSequence) {
      div.classList.add("current");
    }

    container.appendChild(div);
  });
}

function isPathEdgeActive(activeSequence, nodeCode) {
  return activeSequence && activeSequence.startsWith(nodeCode);
}

function formatMorse(seq) {
  return seq.replaceAll(".", "・").replaceAll("-", "－");
}

function flashMessage(element, text) {
  const old = element.textContent;
  element.textContent = text;
  element.classList.remove("feedback-pop");
  void element.offsetWidth;
  element.classList.add("feedback-pop");
  setTimeout(() => {
    element.textContent = old;
  }, 700);
}

function playTone(type) {
  if (!state.sound) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  if (!state.audioContext) {
    state.audioContext = new AudioContext();
  }

  const ctx = state.audioContext;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  const settings = {
    dot: { freq: 640, dur: 0.06, gain: 0.045 },
    dash: { freq: 420, dur: 0.13, gain: 0.05 },
    good: { freq: 820, dur: 0.09, gain: 0.055 },
    bad: { freq: 180, dur: 0.16, gain: 0.05 }
  }[type] || { freq: 500, dur: 0.08, gain: 0.04 };

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(settings.freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(settings.gain, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + settings.dur);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + settings.dur + 0.02);
}
