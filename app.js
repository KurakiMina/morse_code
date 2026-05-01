"use strict";

const SHORT_LONG_THRESHOLD_MS = 320;
const MAX_PRESS_MS = 800;
const LETTER_COMMIT_DELAY_MS = 850;
const MAX_CODE_LENGTH = 10;
const TONE_FREQUENCY = 640;

const MORSE_TABLE = {
  ".-": "A",
  "-...": "B",
  "-.-.": "C",
  "-..": "D",
  ".": "E",
  "..-.": "F",
  "--.": "G",
  "....": "H",
  "..": "I",
  ".---": "J",
  "-.-": "K",
  ".-..": "L",
  "--": "M",
  "-.": "N",
  "---": "O",
  ".--.": "P",
  "--.-": "Q",
  ".-.": "R",
  "...": "S",
  "-": "T",
  "..-": "U",
  "...-": "V",
  ".--": "W",
  "-..-": "X",
  "-.--": "Y",
  "--..": "Z",
  ".----": "1",
  "..---": "2",
  "...--": "3",
  "....-": "4",
  ".....": "5",
  "-....": "6",
  "--...": "7",
  "---..": "8",
  "----.": "9",
  "-----": "0"
};

const BOARD_LAYOUT = [
  { code: "", letter: "", x: 480, y: 84, lx: 0, ly: 0 },

  { code: "---", letter: "O", x: 62, y: 132, lx: 0, ly: -28 },
  { code: "--", letter: "M", x: 150, y: 132, lx: 0, ly: -28 },
  { code: "-", letter: "T", x: 252, y: 132, lx: 0, ly: -28 },

  { code: ".", letter: "E", x: 554, y: 132, lx: 0, ly: -28 },
  { code: "..", letter: "I", x: 648, y: 132, lx: 0, ly: -28 },
  { code: "...", letter: "S", x: 744, y: 132, lx: 0, ly: -28 },
  { code: "....", letter: "H", x: 838, y: 132, lx: 0, ly: -28 },

  { code: "--.-", letter: "Q", x: 58, y: 252, lx: -28, ly: -6 },
  { code: "--.", letter: "G", x: 150, y: 252, lx: 22, ly: -8 },
  { code: "--..", letter: "Z", x: 150, y: 332, lx: 22, ly: -6 },

  { code: "..-", letter: "U", x: 648, y: 252, lx: -22, ly: -8 },
  { code: "...-", letter: "V", x: 744, y: 252, lx: 22, ly: -8 },
  { code: "..-.", letter: "F", x: 648, y: 332, lx: 22, ly: -6 },

  { code: "-.--", letter: "Y", x: 58, y: 440, lx: -22, ly: -8 },
  { code: "-.-", letter: "K", x: 150, y: 440, lx: -22, ly: -8 },
  { code: "-.", letter: "N", x: 282, y: 440, lx: 24, ly: -8 },
  { code: ".-", letter: "A", x: 554, y: 440, lx: -24, ly: -8 },
  { code: ".-.", letter: "R", x: 650, y: 440, lx: 0, ly: 34 },
  { code: ".-..", letter: "L", x: 744, y: 440, lx: 24, ly: -8 },

  { code: "-.-.", letter: "C", x: 150, y: 532, lx: 22, ly: -8 },
  { code: "-..-", letter: "X", x: 62, y: 600, lx: -22, ly: -8 },
  { code: "-..", letter: "D", x: 282, y: 600, lx: 22, ly: -8 },
  { code: "-...", letter: "B", x: 282, y: 680, lx: -18, ly: -8 },

  { code: ".--", letter: "W", x: 554, y: 600, lx: -22, ly: -8 },
  { code: ".--.", letter: "P", x: 650, y: 600, lx: 22, ly: -8 },
  { code: ".---", letter: "J", x: 554, y: 680, lx: 22, ly: -8 }
];

const DIGIT_LAYOUT = [
  { code: ".----", value: "1", x: 100, y: 822 },
  { code: "..---", value: "2", x: 290, y: 822 },
  { code: "...--", value: "3", x: 480, y: 822 },
  { code: "....-", value: "4", x: 670, y: 822 },
  { code: ".....", value: "5", x: 860, y: 822 },
  { code: "-....", value: "6", x: 100, y: 910 },
  { code: "--...", value: "7", x: 290, y: 910 },
  { code: "---..", value: "8", x: 480, y: 910 },
  { code: "----.", value: "9", x: 670, y: 910 },
  { code: "-----", value: "0", x: 860, y: 910 }
];

const currentCodeEl = document.getElementById("currentCode");
const currentLetterEl = document.getElementById("currentLetter");
const outputTextEl = document.getElementById("outputText");
const timeBarEl = document.getElementById("timeBar");
const boardEl = document.getElementById("morseBoard");
const keyButton = document.getElementById("keyButton");
const spaceButton = document.getElementById("spaceButton");
const deleteButton = document.getElementById("deleteButton");
const resetButton = document.getElementById("resetButton");

let currentCode = "";
let outputText = "";
let pressStartTime = 0;
let isPressing = false;
let pressAnimationId = null;
let commitTimerId = null;

let audioContext = null;
let oscillator = null;
let gainNode = null;

const treeNodeMap = new Map();
const digitNodeMap = new Map();
const edgeMap = new Map();
const layoutMap = new Map(BOARD_LAYOUT.map((item) => [item.code, item]));
const digitLayoutMap = new Map(DIGIT_LAYOUT.map((item) => [item.code, item]));

function createSvgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function buildBoard() {
  boardEl.innerHTML = "";
  treeNodeMap.clear();
  digitNodeMap.clear();
  edgeMap.clear();

  const defs = createSvgEl("defs");
  const gradient = createSvgEl("linearGradient", {
    id: "boardGradient",
    x1: "0%",
    y1: "0%",
    x2: "0%",
    y2: "100%"
  });
  gradient.append(
    createSvgEl("stop", { offset: "0%", "stop-color": "#163256" }),
    createSvgEl("stop", { offset: "100%", "stop-color": "#09121f" })
  );
  defs.appendChild(gradient);
  boardEl.appendChild(defs);

  boardEl.append(
    createSvgEl("rect", { x: 8, y: 8, width: 944, height: 964, rx: 28, class: "board-bg" }),
    createSvgEl("rect", { x: 8, y: 8, width: 944, height: 964, rx: 28, class: "board-frame" })
  );

  const titleLeft = createSvgEl("text", { x: 40, y: 48, class: "board-title" });
  titleLeft.textContent = "MORSE";
  const titleRight = createSvgEl("text", { x: 667, y: 48, class: "board-title" });
  titleRight.textContent = "CODE";
  const digitTitle = createSvgEl("text", { x: 480, y: 758, class: "board-subtitle", "text-anchor": "middle" });
  digitTitle.textContent = "NUMBERS";
  boardEl.append(titleLeft, titleRight, digitTitle);

  const edgeLayer = createSvgEl("g", { id: "edgeLayer" });
  const nodeLayer = createSvgEl("g", { id: "nodeLayer" });
  const digitLayer = createSvgEl("g", { id: "digitLayer" });
  boardEl.append(edgeLayer, nodeLayer, digitLayer);

  for (const item of BOARD_LAYOUT) {
    if (item.code === "") continue;
    const parent = layoutMap.get(item.code.slice(0, -1));
    if (!parent) continue;
    const edge = createEdge(parent, item);
    edge.dataset.code = item.code;
    edgeLayer.appendChild(edge);
    edgeMap.set(item.code, edge);
  }

  for (const item of BOARD_LAYOUT) {
    const node = createNode(item);
    nodeLayer.appendChild(node);
    treeNodeMap.set(item.code, node);
  }

  for (const item of DIGIT_LAYOUT) {
    const chip = createDigitChip(item);
    digitLayer.appendChild(chip);
    digitNodeMap.set(item.code, chip);
  }
}

function createEdge(parent, child) {
  const sameRow = parent.y === child.y;
  let points = "";

  if (sameRow || parent.x === child.x) {
    points = `${parent.x},${parent.y} ${child.x},${child.y}`;
  } else {
    const midY = Math.round((parent.y + child.y) / 2);
    points = `${parent.x},${parent.y} ${parent.x},${midY} ${child.x},${midY} ${child.x},${child.y}`;
  }

  return createSvgEl("polyline", {
    points,
    class: "board-edge"
  });
}

function createNode(item) {
  const nodeClass = item.code === "" ? "board-node root" : `board-node ${item.code.endsWith(".") ? "dot" : "dash"}`;
  const group = createSvgEl("g", {
    class: nodeClass,
    transform: `translate(${item.x}, ${item.y})`
  });
  group.dataset.code = item.code;

  if (item.code === "") {
    const antenna = createSvgEl("path", {
      d: "M -16 10 L 0 -12 L 16 10 M -10 2 L 0 -12 L 10 2 M 0 -12 L 0 14",
      class: "antenna-line"
    });
    const base = createSvgEl("circle", { cx: 0, cy: 20, r: 11, class: "node-shape" });
    group.append(antenna, base);
  } else if (item.code.endsWith(".")) {
    group.appendChild(createSvgEl("circle", { cx: 0, cy: 0, r: 13, class: "node-shape" }));
  } else {
    group.appendChild(createSvgEl("rect", { x: -13, y: -13, width: 26, height: 26, rx: 3, class: "node-shape" }));
  }

  if (item.letter) {
    const label = createSvgEl("text", {
      x: item.lx,
      y: item.ly,
      class: "board-node-label"
    });
    label.textContent = item.letter;
    group.appendChild(label);
  }

  return group;
}

function createDigitChip(item) {
  const group = createSvgEl("g", {
    class: "number-chip",
    transform: `translate(${item.x}, ${item.y})`
  });
  group.dataset.code = item.code;

  const rect = createSvgEl("rect", {
    x: -68,
    y: -28,
    width: 136,
    height: 56,
    rx: 14,
    class: "number-chip-body"
  });
  const digit = createSvgEl("text", { x: -34, y: 1, class: "number-chip-digit" });
  digit.textContent = item.value;
  const code = createSvgEl("text", { x: 18, y: 1, class: "number-chip-code" });
  code.textContent = codeToDisplay(item.code).replace(/ /g, "");

  group.append(rect, digit, code);
  return group;
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function startTone() {
  ensureAudioContext();
  oscillator = audioContext.createOscillator();
  gainNode = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = TONE_FREQUENCY;
  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
}

function stopTone() {
  if (!oscillator || !gainNode || !audioContext) return;
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.03);
  oscillator.stop(audioContext.currentTime + 0.04);
  oscillator = null;
  gainNode = null;
}

function startPress(event) {
  if (event) event.preventDefault();
  if (isPressing) return;
  isPressing = true;
  pressStartTime = performance.now();
  keyButton.classList.add("pressing");
  clearTimeout(commitTimerId);
  startTone();
  animateTimeBar();
}

function endPress(event) {
  if (event) event.preventDefault();
  if (!isPressing) return;
  const duration = performance.now() - pressStartTime;
  const symbol = duration >= SHORT_LONG_THRESHOLD_MS ? "-" : ".";
  isPressing = false;
  keyButton.classList.remove("pressing");
  stopTone();
  cancelAnimationFrame(pressAnimationId);
  updateTimeBar(0);
  appendSymbol(symbol);
}

function animateTimeBar() {
  if (!isPressing) return;
  const elapsed = performance.now() - pressStartTime;
  const progress = Math.min(elapsed / MAX_PRESS_MS, 1);
  updateTimeBar(progress);
  pressAnimationId = requestAnimationFrame(animateTimeBar);
}

function updateTimeBar(progress) {
  timeBarEl.style.width = `${Math.round(progress * 100)}%`;
}

function appendSymbol(symbol) {
  if (currentCode.length >= MAX_CODE_LENGTH) {
    flashInvalid();
    return;
  }

  currentCode += symbol;
  updateDisplay();
  updateBoardState(false);

  clearTimeout(commitTimerId);
  commitTimerId = setTimeout(commitLetter, LETTER_COMMIT_DELAY_MS);
}

function commitLetter() {
  if (!currentCode) return;

  updateBoardState(true);
  const letter = MORSE_TABLE[currentCode] || "?";
  outputText += letter;
  currentCode = "";

  setTimeout(() => {
    updateDisplay();
    updateBoardState(false);
  }, 240);
}

function flashInvalid() {
  keyButton.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(0)" }
    ],
    {
      duration: 180,
      easing: "ease-out"
    }
  );
}

function codeToDisplay(code) {
  if (!code) return "未入力";
  return [...code].map((symbol) => (symbol === "." ? "●" : "■")).join(" ");
}

function getCurrentLetterLabel(code) {
  if (!code) return "-";
  return MORSE_TABLE[code] || "未対応";
}

function updateDisplay() {
  currentCodeEl.textContent = codeToDisplay(currentCode);
  currentLetterEl.textContent = getCurrentLetterLabel(currentCode);
  outputTextEl.textContent = outputText || "-";
}

function clearStates() {
  for (const node of treeNodeMap.values()) {
    node.classList.remove("path", "active", "final");
  }
  for (const node of digitNodeMap.values()) {
    node.classList.remove("path", "current", "final");
  }
  for (const edge of edgeMap.values()) {
    edge.classList.remove("path");
  }
}

function updateBoardState(isFinal) {
  clearStates();

  const root = treeNodeMap.get("");
  if (root) {
    root.classList.add("path");
  }

  let partial = "";
  let lastMatchedCode = "";

  for (const symbol of currentCode) {
    partial += symbol;
    const node = treeNodeMap.get(partial);
    const edge = edgeMap.get(partial);
    if (edge) edge.classList.add("path");
    if (node) {
      node.classList.add("path");
      lastMatchedCode = partial;
    }
  }

  if (!currentCode) return;

  if (treeNodeMap.has(currentCode)) {
    const node = treeNodeMap.get(currentCode);
    node.classList.remove("path");
    node.classList.add(isFinal ? "final" : "active");
  } else if (digitNodeMap.has(currentCode)) {
    const chip = digitNodeMap.get(currentCode);
    chip.classList.add(isFinal ? "final" : "current");
  } else if (lastMatchedCode && treeNodeMap.has(lastMatchedCode)) {
    const node = treeNodeMap.get(lastMatchedCode);
    node.classList.remove("path");
    node.classList.add(isFinal ? "final" : "active");
  }
}

function addSpace() {
  if (outputText && !outputText.endsWith(" ")) {
    outputText += " ";
    updateDisplay();
  }
}

function deleteLast() {
  if (currentCode) {
    currentCode = currentCode.slice(0, -1);
  } else {
    outputText = outputText.slice(0, -1);
  }
  clearTimeout(commitTimerId);
  updateDisplay();
  updateBoardState(false);
}

function resetAll() {
  currentCode = "";
  outputText = "";
  clearTimeout(commitTimerId);
  updateDisplay();
  updateBoardState(false);
}

keyButton.addEventListener("pointerdown", startPress);
keyButton.addEventListener("pointerup", endPress);
keyButton.addEventListener("pointercancel", endPress);
keyButton.addEventListener("pointerleave", () => {
  if (isPressing) endPress();
});

spaceButton.addEventListener("click", addSpace);
deleteButton.addEventListener("click", deleteLast);
resetButton.addEventListener("click", resetAll);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.repeat) {
    event.preventDefault();
    startPress(event);
  }
  if (event.code === "Backspace") {
    event.preventDefault();
    deleteLast();
  }
  if (event.code === "Escape") {
    resetAll();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    endPress(event);
  }
});

buildBoard();
updateDisplay();
updateBoardState(false);
