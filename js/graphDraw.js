import { clamp, nodeLabel, edgeKey } from "./utils.js";
import { state } from "./state.js";

const svg = document.getElementById("graphSvg");

function svgClear() {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function initPositionsIfNeeded() {
  if (state.pos && Object.keys(state.pos).length === state.n) return;

  const W = Number(svg.getAttribute("width"));
  const H = Number(svg.getAttribute("height"));
  const margin = 60;

  const cx = W / 2, cy = H / 2;
  const r = Math.min(W, H) / 2 - margin;

  state.pos = {};
  for (let i = 0; i < state.n; i++) {
    const ang = (2 * Math.PI * i) / state.n - Math.PI / 2;
    state.pos[i] = { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
  }
}

let drag = { active: false, node: null, offsetX: 0, offsetY: 0 };

function svgPointFromMouseEvent(ev) {
  const rect = svg.getBoundingClientRect();
  return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
}

function onNodeMouseDown(ev, nodeIndex, highlightGetter) {
  ev.preventDefault();
  initPositionsIfNeeded();

  const p = svgPointFromMouseEvent(ev);
  const cur = state.pos[nodeIndex];

  drag.active = true;
  drag.node = nodeIndex;
  drag.offsetX = cur.x - p.x;
  drag.offsetY = cur.y - p.y;

  ev.currentTarget.style.cursor = "grabbing";

  window.addEventListener("mousemove", (e) => onMouseMove(e, highlightGetter));
  window.addEventListener("mouseup", onMouseUp, { once: true });
}

function onMouseMove(ev, highlightGetter) {
  if (!drag.active) return;

  const W = Number(svg.getAttribute("width"));
  const H = Number(svg.getAttribute("height"));
  const margin = 25;

  const p = svgPointFromMouseEvent(ev);
  const x = clamp(p.x + drag.offsetX, margin, W - margin);
  const y = clamp(p.y + drag.offsetY, margin, H - margin);

  state.pos[drag.node] = { x, y };

  const h = highlightGetter ? highlightGetter() : {};
  drawGraph(state, h, highlightGetter);
}

function onMouseUp() {
  drag.active = false;
  drag.node = null;
  window.removeEventListener("mousemove", onMouseMove);
}

export function drawGraph(graph, highlight = {}, highlightGetter = null) {
  initPositionsIfNeeded();
  const pos = state.pos;

  svgClear();

  const accepted = highlight.accepted || new Set();
  const rejected = highlight.rejected || new Set();
  const currentKey = highlight.currentKey || null;

  // aristas
  for (const e of graph.edges) {
    const key = edgeKey(e.u, e.v);
    const a = pos[e.u], b = pos[e.v];

    let stroke = "#cfcfcf";
    let width = 2;
    let dash = "";

    if (rejected.has(key)) { stroke = "#9aa0a6"; dash = "6 6"; width = 3; }
    if (accepted.has(key)) { stroke = "#e53935"; dash = ""; width = 4; }
    if (currentKey === key) { stroke = "#fb8c00"; dash = ""; width = 5; }

    svg.appendChild(svgEl("line", {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke, "stroke-width": width, "stroke-dasharray": dash
    }));

    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    svg.appendChild(svgEl("rect", {
      x: mx - 12, y: my - 10, width: 24, height: 18,
      fill: "white", opacity: "0.85", rx: 6, ry: 6
    }));

    const text = svgEl("text", {
      x: mx, y: my + 4,
      "text-anchor": "middle",
      "font-size": "12",
      "font-family": "system-ui"
    });
    text.textContent = String(e.w);
    svg.appendChild(text);
  }

  // nodos (drag)
  for (let i = 0; i < graph.n; i++) {
    const p = pos[i];

    const g = svgEl("g", { "data-node": String(i), style: "cursor: grab;" });

    g.appendChild(svgEl("circle", {
      cx: p.x, cy: p.y, r: 18,
      fill: "#1e40af", stroke: "#0b1220", "stroke-width": 2
    }));

    const t = svgEl("text", {
      x: p.x, y: p.y + 5,
      "text-anchor": "middle",
      "font-size": "14",
      "font-weight": "700",
      fill: "white",
      "font-family": "system-ui",
      "pointer-events": "none"
    });
    t.textContent = nodeLabel(i);

    g.appendChild(t);
    svg.appendChild(g);

    g.addEventListener("mousedown", (ev) => onNodeMouseDown(ev, i, highlightGetter));
  }
}