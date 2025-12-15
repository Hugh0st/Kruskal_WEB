import { clamp, nodeLabel, edgeKey } from "./utils.js";
import { state } from "./state.js";
import { isConnected } from "./unionfind.js";

export const dom = {
  nInput: document.getElementById("nInput"),
  applyN: document.getElementById("applyN"),
  nodesLabel: document.getElementById("nodesLabel"),

  addEdgeBtn: document.getElementById("addEdge"),
  clearEdgesBtn: document.getElementById("clearEdges"),
  edgesContainer: document.getElementById("edgesContainer"),

  edgesCount: document.getElementById("edgesCount"),
  minEdges: document.getElementById("minEdges"),
  connectedPill: document.getElementById("connectedPill"),
  validPill: document.getElementById("validPill"),

  errorBox: document.getElementById("errorBox"),
  successBox: document.getElementById("successBox"),

  continueBtn: document.getElementById("continueBtn"),
};

export function renderNodesLabel() {
  const labels = Array.from({ length: state.n }, (_, i) => nodeLabel(i)).join(", ");
  dom.nodesLabel.textContent = `Nodos: ${labels}`;
}

function makeNodeSelect(value, onChange, forbiddenValue = null) {
  const sel = document.createElement("select");
  for (let i = 0; i < state.n; i++) {
    if (forbiddenValue !== null && i === forbiddenValue) continue;
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = nodeLabel(i);
    sel.appendChild(opt);
  }
  sel.value = String(value);
  sel.onchange = () => onChange(Number(sel.value));
  return sel;
}

export function renderEdges(renderAll) {
  dom.edgesContainer.innerHTML = "";

  state.edges.forEach((e, idx) => {
    const row = document.createElement("div");
    row.className = "edge-row";

    const uSel = makeNodeSelect(e.u, (newU) => {
      e.u = newU;
      if (e.u === e.v) {
        e.v = (e.v + 1) % state.n;
        if (e.v === e.u) e.v = (e.u + 1) % state.n;
      }
      renderAll();
    });

    const wInp = document.createElement("input");
    wInp.type = "number";
    wInp.min = "1";
    wInp.max = "100";
    wInp.step = "1";
    wInp.value = String(e.w);
    wInp.oninput = () => {
      e.w = Number(wInp.value);
      renderAll();
    };

    const vSel = makeNodeSelect(e.v, (newV) => {
      e.v = newV;
      renderAll();
    }, e.u);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Eliminar";
    delBtn.onclick = () => {
      state.edges.splice(idx, 1);
      renderAll();
    };

    row.appendChild(uSel);
    row.appendChild(wInp);
    row.appendChild(vSel);
    row.appendChild(delBtn);
    dom.edgesContainer.appendChild(row);
  });
}

export function validate() {
  const errors = [];
  const n = state.n;
  const E = state.edges.length;

  for (let i = 0; i < state.edges.length; i++) {
    const e = state.edges[i];
    if (e.u === e.v) errors.push(`Arista #${i + 1}: u y v no pueden ser iguales.`);
    if (!Number.isInteger(e.w) || e.w < 1 || e.w > 100) {
      errors.push(`Arista #${i + 1}: peso inválido (${e.w}). Debe ser entero 1..100.`);
    }
    if (e.u < 0 || e.u >= n || e.v < 0 || e.v >= n) {
      errors.push(`Arista #${i + 1}: nodo fuera de rango.`);
    }
  }

  const seen = new Set();
  for (const e of state.edges) {
    const key = edgeKey(e.u, e.v);
    if (seen.has(key)) errors.push(`Arista duplicada detectada: ${nodeLabel(Math.min(e.u, e.v))}—${nodeLabel(Math.max(e.u, e.v))}.`);
    seen.add(key);
  }

  const minE = n - 1;
  if (E < minE) errors.push(`El grafo tiene ${E} aristas, pero el mínimo requerido es ${minE} (N-1).`);

  const connected = isConnected(n, state.edges);
  if (!connected) errors.push(`El grafo NO está conectado (hay nodos aislados o componentes separados).`);

  return { ok: errors.length === 0, errors, connected };
}

export function renderStatus() {
  const n = state.n;
  const E = state.edges.length;

  dom.edgesCount.textContent = `Aristas: ${E}`;
  dom.minEdges.textContent = `Mínimo requerido: ${n - 1}`;

  const { ok, errors, connected } = validate();

  dom.connectedPill.textContent = `Conectado: ${connected ? "Sí" : "No"}`;
  dom.connectedPill.className = "pill " + (connected ? "ok" : "bad");

  dom.validPill.textContent = `Válido: ${ok ? "Sí" : "No"}`;
  dom.validPill.className = "pill " + (ok ? "ok" : "bad");

  dom.errorBox.textContent = ok ? "" : errors.map(e => "• " + e).join("\n");
  dom.successBox.textContent = ok ? "✅ Grafo válido. Ya puedes continuar a Kruskal." : "";
}

export function wireUi(renderAll) {
  dom.applyN.onclick = () => {
    const n = clamp(Number(dom.nInput.value), 2, 24);
    if (!Number.isInteger(n)) {
      alert("N debe ser un entero.");
      return;
    }
    state.n = n;
    state.edges = [];
    state.pos = null;
    renderAll();
  };

  dom.addEdgeBtn.onclick = () => {
    if (state.n < 2) return;
    state.edges.push({ u: 0, v: 1, w: 1 });
    renderAll();
  };

  dom.clearEdgesBtn.onclick = () => {
    state.edges = [];
    renderAll();
  };
}