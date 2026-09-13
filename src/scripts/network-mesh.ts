/** Malla tipo red (nodos + aristas) para la capa flotante. */

const SVG_NS = 'http://www.w3.org/2000/svg';

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clearGroup(group: SVGGElement): void {
  while (group.firstChild) group.removeChild(group.firstChild);
}

function dist2(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/**
 * Genera una red irregular (malla) a escala de página.
 * El recorte al lado blanco del spine lo aplica el clipPath.
 */
export function renderNetworkMesh(
  mesh: SVGGElement,
  W: number,
  H: number,
): void {
  clearGroup(mesh);

  const compact = window.matchMedia('(max-width: 767px)').matches;
  const cols = compact ? 9 : 14;
  const rows = compact ? 14 : 22;
  const rand = seededRandom(42);
  const jitterX = (W / cols) * 0.38;
  const jitterY = (H / rows) * 0.38;

  const points: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Sesgo hacia la derecha: más densidad donde suele estar el blanco
      const u = c / Math.max(1, cols - 1);
      const v = r / Math.max(1, rows - 1);
      if (u < 0.2 && rand() > 0.35) continue;
      const x = u * W + (rand() - 0.5) * 2 * jitterX;
      const y = v * H + (rand() - 0.5) * 2 * jitterY;
      // Ligera rarefacción hacia abajo-derecha (como la referencia)
      if (u > 0.7 && v > 0.65 && rand() > 0.55) continue;
      points.push([
        Math.max(0, Math.min(W, x)),
        Math.max(0, Math.min(H, y)),
      ]);
    }
  }

  const maxLink = Math.hypot(W / cols, H / rows) * (compact ? 2.1 : 2.35);
  const maxLink2 = maxLink * maxLink;
  const neighbors = compact ? 2 : 3;
  const seen = new Set<string>();

  const edgesG = document.createElementNS(SVG_NS, 'g');
  edgesG.setAttribute('class', 'float-graphs__edges');
  const nodesG = document.createElementNS(SVG_NS, 'g');
  nodesG.setAttribute('class', 'float-graphs__nodes');

  for (let i = 0; i < points.length; i++) {
    const scored: Array<{ j: number; d: number }> = [];
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const d = dist2(points[i], points[j]);
      if (d > maxLink2 || d < 1) continue;
      scored.push({ j, d });
    }
    scored.sort((a, b) => a.d - b.d);
    for (const { j } of scored.slice(0, neighbors)) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const [x1, y1] = points[i];
      const [x2, y2] = points[j];
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      edgesG.appendChild(line);
    }
  }

  for (const [x, y] of points) {
    const node = document.createElementNS(SVG_NS, 'circle');
    node.setAttribute('cx', String(x));
    node.setAttribute('cy', String(y));
    node.setAttribute('r', compact ? '4.5' : '5.5');
    nodesG.appendChild(node);
  }

  mesh.appendChild(edgesG);
  mesh.appendChild(nodesG);
}
