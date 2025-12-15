import { state } from "./state.js";
import { drawGraph } from "./graphDraw.js";
import { dom, renderNodesLabel, renderEdges, renderStatus, validate, wireUi } from "./ui.js";
import { kruskalInit, kruskalStep } from "./kruskal.js";
import { edgeKey, nodeLabel } from "./utils.js";

const kruskalCard = document.getElementById("kruskalCard");
const kReset = document.getElementById("kReset");
const kStep = document.getElementById("kStep");
const kAuto = document.getElementById("kAuto");
const kStop = document.getElementById("kStop");

const kEdgeIdx = document.getElementById("kEdgeIdx");
const kMstCount = document.getElementById("kMstCount");
const kTotal = document.getElementById("kTotal");
const kDone = document.getElementById("kDone");
const kLog = document.getElementById("kLog");
const kError = document.getElementById("kError");

let kState = null;
let kTimer = null;
let acceptedSet = new Set();
let rejectedSet = new Set();
let currentKey = null;

function highlightGetter() {
  return { accepted: acceptedSet, rejected: rejectedSet, currentKey };
}

function renderAll() {
  renderNodesLabel();
  renderEdges(renderAll);
  renderStatus();
  drawGraph(state, highlightGetter(), highlightGetter);
}

function kRenderStatus() {
  if (!kState) return;
  kEdgeIdx.textContent = `Arista: ${Math.min(kState.i, kState.edges.length)}/${kState.edges.length}`;
  kMstCount.textContent = `MST: ${kState.mst.length}/${kState.n - 1}`;
  kTotal.textContent = `Total: ${kState.total}`;
  kDone.textContent = `Estado: ${kState.done ? "Terminado" : "En proceso"}`;
  kDone.className = "pill " + (kState.done ? "ok" : "bad");
}

function kLogLine(text) {
  kLog.textContent += text + "\n";
  kLog.scrollTop = kLog.scrollHeight;
}

function kStopAuto() {
  if (kTimer) {
    clearInterval(kTimer);
    kTimer = null;
  }
  kStop.disabled = true;
  kAuto.disabled = false;
}

function kStart() {
  kError.textContent = "";
  kLog.textContent = "";

  kState = kruskalInit(state);

  kStep.disabled = false;
  kAuto.disabled = false;
  kStop.disabled = true;

  acceptedSet = new Set();
  rejectedSet = new Set();
  currentKey = null;

  kRenderStatus();

  kLogLine("Orden de aristas (por peso):");
  kState.edges.forEach((e, idx) => kLogLine(`${idx + 1}. ${nodeLabel(e.u)}—${nodeLabel(e.v)} w=${e.w}`));
  kLogLine("----------------------------------------");

  drawGraph(state, highlightGetter(), highlightGetter);
}

function kDoStep() {
  if (!kState) return;

  if (kState.done) {
    currentKey = null;
    drawGraph(state, highlightGetter(), highlightGetter);
    kStep.disabled = true;
    return;
  }

  const ev = kruskalStep(kState);

  if (ev.edge) currentKey = edgeKey(ev.edge.u, ev.edge.v);
  if (ev.type === "accept") acceptedSet.add(currentKey);
  if (ev.type === "reject") rejectedSet.add(currentKey);

  drawGraph(state, highlightGetter(), highlightGetter);

  if (ev.type === "accept") kLogLine("✅ " + ev.message);
  else if (ev.type === "reject") kLogLine("❌ " + ev.message);
  else kLogLine(ev.message);

  kRenderStatus();

  if (kState.done) {
    kStopAuto();
    kStep.disabled = true;
    kLogLine("----------------------------------------");
    kLogLine("MST final:");
    kState.mst.forEach((e) => kLogLine(`${nodeLabel(e.u)}—${nodeLabel(e.v)} w=${e.w}`));
    kLogLine(`Peso total = ${kState.total}`);
  }
}

// continuar
dom.continueBtn.onclick = () => {
  const { ok, errors } = validate();
  if (!ok) {
    alert("No se puede continuar:\n\n" + errors.join("\n"));
    return;
  }

  kruskalCard.style.display = "block";
  kStart();
  kruskalCard.scrollIntoView({ behavior: "smooth" });
};

// botones kruskal
kReset.onclick = () => { kStopAuto(); kStart(); };
kStep.onclick = () => kDoStep();

kAuto.onclick = () => {
  if (!kState) return;
  kAuto.disabled = true;
  kStop.disabled = false;
  kTimer = setInterval(() => {
    if (!kState || kState.done) { kStopAuto(); return; }
    kDoStep();
  }, 600);
};

kStop.onclick = () => kStopAuto();

// init
wireUi(renderAll);
renderAll();