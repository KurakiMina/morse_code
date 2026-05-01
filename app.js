"use strict";

const SHORT_LONG_THRESHOLD_MS = 320;
const MAX_PRESS_MS = 800;
const LETTER_COMMIT_DELAY_MS = 850;
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
  { code: "", letter: "", x: 480, y: 86, labelDx: 0, labelDy: 0, note: "" },
  { code: "-", letter: "T", x: 312, y: 120, labelDx: 0, labelDy: -28 },
  { code: "--", letter: "M", x: 196, y: 120, labelDx: 0, labelDy: -28 },
  { code: "---", letter: "O", x: 88, y: 120, labelDx: 0, labelDy: -28 },
  { code: "--.", letter: "G", x: 196, y: 238, labelDx: 24, labelDy: -6 },
  { code: "--..", letter: "Z", x: 196, y: 320, labelDx: 24, labelDy: -6 },
  { code: "--.-", letter: "Q", x: 78, y: 238, labelDx: -26, labelDy: -6 },
  { code: "-.", letter: "N", x: 364, y: 392, labelDx: 22, labelDy: -8 },
  { code: "-.-", letter: "K", x: 152, y: 392, labelDx: -22, labelDy: -8 },
  { code: "-.-.", letter: "C", x: 152, y: 486, labelDx: -22, labelDy: -8 },
  { code: "-.--", letter: "Y", x: 58, y: 392, labelDx: -20, labelDy: -8 },
  { code: "-..", letter: "D", x: 282, y: 548, labelDx: 24, labelDy: -6 },
  { code: "-...", letter: "B", x: 282, y: 626, labelDx: -18, labelDy: -8 },
  { code: "-..-", letter: "X", x: 88, y: 548, labelDx: -20, labelDy: -8 },

  { code: ".", letter: "E", x: 552, y: 120, labelDx: 0, labelDy: -28 },
  { code: "..", letter: "I", x: 640, y: 120, labelDx: 0, labelDy: -28 },
  { code: "...", letter: "S", x: 730, y: 120, labelDx: 0, labelDy: -28 },
  { code: "....", letter: "H", x: 820, y: 120, labelDx: 0, labelDy: -28 },
  { code: "..-", letter: "U", x: 640, y: 238, labelDx: -22, labelDy: -8 },
  { code: "..-.", letter: "F", x: 640, y: 320, labelDx: 24, labelDy: -6 },
  { code: "...-", letter: "V", x: 730, y: 238, labelDx: 22, labelDy: -8 },
  { code: ".-", letter: "A", x: 536, y: 454, labelDx: -22, labelDy: -8 },
  { code: ".-.", letter: "R", x: 624, y: 454, labelDx: 22, labelDy: -8 },
  { code: ".-..", letter: "L", x: 718, y: 454, labelDx: 20, labelDy: -8 },
  { code: ".--", letter: "W", x: 536, y: 548, labelDx: -22, labelDy: -8 },
  { code: ".--.", letter: "P", x: 622, y: 548, labelDx: 22, labelDy: -8 },
  { code: ".---", letter: "J", x: 536, y: 626, labelDx: 22, labelDy: -8 }
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

const nodeMap = new Map();
const edgeMap = new Map();
const BOARD_CENTER_X = 480;

function createSvgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

function buildBoard() {
  boardEl.innerHTML = "";
  nodeMap.clear();
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
    createSvgEl("stop", { offset: "0%", "stop-color": "#112038" }),
    createSvgEl("stop", { offset: "100%", "stop-color": "#08101d" })
  );
  defs.appendChild(gradient);
  boardEl.appendChild(defs);

  boardEl.append(
    createSvgEl("rect", { x: 8, y: 8, width: 944, height: 644, rx: 28, class: "board-bg" }),
    createSvgEl("rect", { x: 8, y: 8, width: 944, height: 644, rx: 28, class: "board-frame" })
  );

  const titleLeft = createSvgEl("text", { x: 44, y: 48, class: "board-title" });
  titleLeft.textContent = "MORSE";
  const titleRight = createSvgEl("text", { x: 664, y: 48, class: "board-title" });
  titleRight.textContent = "CODE";
  boardEl.append(titleLeft, titleRight);

  const edgeLayer = createSvgEl("g", { id: "edgeLayer" });
  const nodeLayer = createSvgEl("g", { id: "nodeLayer" });
  boardEl.append(edgeLayer, nodeLayer);

  const layoutMap = new Map(BOARD_LAYOUT.map((item) => [item.code, item]));

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
    const group = createNode(item);
    nodeLayer.appendChild(group);
    nodeMap.set(item.code, group);
  }
}

function createEdge(parent, child) {
  const sameRow = parent.y === child.y;
  let points = "";

  if (sameRow) {
    points = `${parent.x},${parent.y} ${child.x},${child.y}`;
  } else if (parent.x === child.x) {
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
  const group = createSvgEl("g", {
    class: item.code === "" ? "board-node root" : `board-node ${item.code.endsWith(".") ? "dot" : "dash"}`,
    transform: `translate(${item.x}, ${item.y})`
  });
  group.dataset.code = item.code;

  if (item.code === "") {
    const antenna = createSvgEl("path", {
      d: "M -14 10 L 0 -12 L 14 10 M -8 2 L 0 -12 L 8 2 M 0 -12 L 0 18",
      class: "antenna-line"
    });
    const base = createSvgEl("circle", {
      cx: 0,
      cy: 20,
      r: 10,
      class: "board-node-shape"
    });
    group.append(antenna, base);
  } else if (item.code.endsWith(".")) {
    group.appendChild(
      createSvgEl("circle", {
        cx: 0,
        cy: 0,
        r: 12,
        class: "board-node-shape"
      })
    );
  } else {
    group.appendChild(
      createSvgEl("rect", {
        x: -12,
        y: -12,
        width: 24,
        height: 24,
        rx: 3,
        class: "board-node-shape"
      })
    );
  }

  if (item.letter) {
    const label = createSvgEl("text", {
      x: item.labelDx,
      y: item.labelDy,
      class: "board-node-label"
    });
    label.textContent = item.letter;
    group.appendChild(label);
  }

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
  const nextCode = currentCode + symbol;

  if (nextCode.length > 5) {
    flashInvalid();
    return;
  }

  currentCode = nextCode;
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
      duration: 160,
      easing: "ease-out"
    }
  );
}

function codeToDisplay(code) {
  if (!code) return "未入力";
  return [...code].map((symbol) => (symbol === "." ? "●" : "■")).join(" ");
}

function updateDisplay() {
  currentCodeEl.textContent = codeToDisplay(currentCode);
  currentLetterEl.textContent = currentCode ? (MORSE_TABLE[currentCode] || "?") : "-";
  outputTextEl.textContent = outputText || "-";
}

function updateBoardState(isFinal) {
  for (const node of nodeMap.values()) {
    node.classList.remove("path", "active", "final");
  }

  for (const edge of edgeMap.values()) {
    edge.classList.remove("path");
  }

  const root = nodeMap.get("");
  if (root) {
    root.classList.add("path");
  }

  let partial = "";
  for (const symbol of currentCode) {
    partial += symbol;
    const node = nodeMap.get(partial);
    const edge = edgeMap.get(partial);
    if (node) node.classList.add("path");
    if (edge) edge.classList.add("path");
  }

  const activeNode = nodeMap.get(currentCode);
  if (activeNode && currentCode) {
    activeNode.classList.remove("path");
    activeNode.classList.add(isFinal ? "final" : "active");
    scrollBoardToNode(currentCode);
  }
}

function scrollBoardToNode(code) {
  const item = BOARD_LAYOUT.find((node) => node.code === code);
  const scrollParent = boardEl.parentElement;
  if (!item || !scrollParent) return;

  const totalWidth = boardEl.viewBox.baseVal.width || 960;
  const target = (item.x / totalWidth) * boardEl.clientWidth;
  const centerOffset = scrollParent.clientWidth / 2;
  const nextLeft = Math.max(0, target - centerOffset);
  scrollParent.scrollTo({ left: nextLeft, behavior: "smooth" });
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
