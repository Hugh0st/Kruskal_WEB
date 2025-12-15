export class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }
  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra]++;
    return true;
  }
}

export function isConnected(n, edges) {
  if (n <= 1) return true;
  if (edges.length === 0) return false;

  const uf = new UnionFind(n);
  for (const e of edges) uf.union(e.u, e.v);

  const root0 = uf.find(0);
  for (let i = 1; i < n; i++) {
    if (uf.find(i) !== root0) return false;
  }
  return true;
}