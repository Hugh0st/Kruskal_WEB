export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function nodeLabel(idx) {
  return ALPHABET[idx];
}

export function edgeKey(u, v) {
  const a = Math.min(u, v), b = Math.max(u, v);
  return `${a}-${b}`;
}