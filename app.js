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

const currentCodeEl = document.getElementById("currentCode");
const currentLetterEl = document.getElementById("currentLetter");
const outputTextEl = document.getElementById("outputText");
const timeBarEl = document.getElementById("timeBar");
const treeEl = document.getElementById("morseTree");
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

function buildMorseTree() {
  treeEl.innerHTML = "";
  nodeMap.clear();
  edgeMap.clear();

  addNode("", "ANT", 1, 16, "root");

  for (const [code, letter] of Object.entries(MORSE_TABLE)) {
    const row = code.length + 1;
    const col = getGridColumn(code);
    const typeClass = code.endsWith(".") ? "dot" : "dash";
    addNode(code, letter, row, col, typeClass);
  }

  requestAnimationFrame(drawEdges);
}

function getGridColumn(code) {
  let index = 0;
  for (const symbol of code) {
    index = index * 2 + (symbol === "." ? 0 : 1);
  }

  const depth = code.length;
  const slots = 2 ** depth;
  const span = 32 / slots;
  return Math.round(index * span + span / 2);
}

function addNode(code, label, row, col, className) {
  const node = document.createElement("div");
  node.className = `node ${className}`;
  node.dataset.code = code;
  node.textContent = label;
  node.style.gridRow = String(row);
  node.style.gridColumn = String(col);

  treeEl.appendChild(node);
  nodeMap.set(code, node);
}

function drawEdges() {
  const existingEdges = treeEl.querySelectorAll(".edge");
  existingEdges.forEach((edge) => edge.remove());
  edgeMap.clear();

  for (const code of nodeMap.keys()) {
    if (code === "") continue;

    const parentCode = code.slice(0, -1);
    const parentNode = nodeMap.get(parentCode);
    const childNode = nodeMap.get(code);

    if (!parentNode || !childNode) continue;

    const edge = createEdge(parentNode, childNode);
    edge.dataset.code = code;
    treeEl.appendChild(edge);
    edgeMap.set(code, edge);
  }
}

function createEdge(fromNode, toNode) {
  const treeRect = treeEl.getBoundingClientRect();
  const fromRect = fromNode.getBoundingClientRect();
  const toRect = toNode.getBoundingClientRect();

  const x1 = fromRect.left + fromRect.width / 2 - treeRect.left + treeEl.scrollLeft;
  const y1 = fromRect.top + fromRect.height / 2 - treeRect.top + treeEl.scrollTop;
  const x2 = toRect.left + toRect.width / 2 - treeRect.left + treeEl.scrollLeft;
  const y2 = toRect.top + toRect.height / 2 - treeRect.top + treeEl.scrollTop;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  const edge = document.createElement("div");
  edge.className = "edge";
  edge.style.width = `${length}px`;
  edge.style.left = `${x1}px`;
  edge.style.top = `${y1}px`;
  edge.style.transform = `rotate(${angle}deg)`;

  return edge;
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
  if (event) {
    event.preventDefault();
  }

  if (isPressing) return;

  isPressing = true;
  pressStartTime = performance.now();
  keyButton.classList.add("pressing");

  clearTimeout(commitTimerId);
  startTone();
  animateTimeBar();
}

function endPress(event) {
  if (event) {
    event.preventDefault();
  }

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
  updateTreeState(false);

  clearTimeout(commitTimerId);
  commitTimerId = setTimeout(commitLetter, LETTER_COMMIT_DELAY_MS);
}

function commitLetter() {
  if (!currentCode) return;

  updateTreeState(true);

  const letter = MORSE_TABLE[currentCode] || "?";
  outputText += letter;

  currentCode = "";

  setTimeout(() => {
    updateDisplay();
    updateTreeState(false);
  }, 180);
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

function updateDisplay() {
  currentCodeEl.textContent = currentCode || "–¢“ü—Í";
  currentLetterEl.textContent = currentCode ? (MORSE_TABLE[currentCode] || "?") : "-";
  outputTextEl.textContent = outputText || "-";
}

function updateTreeState(isFinal) {
  for (const node of nodeMap.values()) {
    node.classList.remove("active", "path", "final");
  }

  for (const edge of edgeMap.values()) {
    edge.classList.remove("active");
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
    if (edge) edge.classList.add("active");
  }

  const activeNode = nodeMap.get(currentCode);
  if (activeNode && currentCode) {
    activeNode.classList.add(isFinal ? "final" : "active");
    scrollNodeIntoView(activeNode);
  }
}

function scrollNodeIntoView(node) {
  const nodeRect = node.getBoundingClientRect();
  const scrollRect = treeEl.parentElement.getBoundingClientRect();

  const isLeftOut = nodeRect.left < scrollRect.left;
  const isRightOut = nodeRect.right > scrollRect.right;

  if (isLeftOut || isRightOut) {
    node.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
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
  updateTreeState(false);
}

function resetAll() {
  currentCode = "";
  outputText = "";
  clearTimeout(commitTimerId);
  updateDisplay();
  updateTreeState(false);
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

window.addEventListener("resize", () => {
  requestAnimationFrame(drawEdges);
});

buildMorseTree();
updateDisplay();
updateTreeState(false);