import { edgeKey, nodeLabel } from "./utils.js";
import { UnionFind } from "./unionfind.js";

export function kruskalInit(graph) {
  const edgesSorted = graph.edges
    .map((e, i) => ({ ...e, _id: i }))
    .sort((a, b) => a.w - b.w || edgeKey(a.u, a.v).localeCompare(edgeKey(b.u, b.v)));

  const uf = new UnionFind(graph.n);

  return {
    n: graph.n,
    edges: edgesSorted,
    i: 0,
    mst: [],
    total: 0,
    uf,
    done: false,
    reason: "",
  };
}

export function kruskalStep(s) {
  if (s.done) return { type: "done", message: s.reason || "Terminado." };

  if (s.mst.length === s.n - 1) {
    s.done = true;
    s.reason = "✅ MST completo (N-1 aristas).";
    return { type: "done", message: s.reason };
  }

  if (s.i >= s.edges.length) {
    s.done = true;
    s.reason = "⚠️ Se acabaron las aristas antes de completar el MST (¿grafo no conectado?).";
    return { type: "done", message: s.reason };
  }

  const e = s.edges[s.i++];
  const ru = s.uf.find(e.u);
  const rv = s.uf.find(e.v);

  if (ru !== rv) {
    s.uf.union(ru, rv);
    s.mst.push({ u: e.u, v: e.v, w: e.w });
    s.total += e.w;
    return { type: "accept", edge: e, message: `ACEPTA ${nodeLabel(e.u)}—${nodeLabel(e.v)} (w=${e.w})` };
  } else {
    return { type: "reject", edge: e, message: `RECHAZA ${nodeLabel(e.u)}—${nodeLabel(e.v)} (w=${e.w}) (ciclo)` };
  }
}