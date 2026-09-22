let cv;
let ctx;
let zoom = 1;
let panX = 0;
let panY = 0;
let drag = false;
let last = { x: 0, y: 0 };
let used = false;

export function inizializzaPianta(c) {
  cv = c;
  ctx = c.getContext("2d");

  c.addEventListener("wheel", e => {
    e.preventDefault();
    used = true;
    zoom *= e.deltaY < 0 ? 1.1 : 0.9;
    draw(window.CACEM_STATE);
  });

  c.addEventListener("pointerdown", e => {
    drag = true;
    used = true;
    last = e;
  });

  c.addEventListener("pointerup", () => {
    drag = false;
  });

  c.addEventListener("pointermove", e => {
    if (!drag) return;
    panX += e.clientX - last.clientX;
    panY += e.clientY - last.clientY;
    last = e;
    draw(window.CACEM_STATE);
  });
}

export function resetPianta() {
  zoom = 1;
  panX = 0;
  panY = 0;
  used = false;
  draw(window.CACEM_STATE);
}

function draw(s) {
  if (!ctx || !s) return;

  const dpr = devicePixelRatio;
  const w = cv.clientWidth;
  const h = cv.clientHeight;

  cv.width = w * dpr;
  cv.height = h * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const L = s.campate.reduce((a, c) => a + c.interasse, 0);
  const W = s.generale.luce;
  const sc = Math.min((w - 100) / L, (h - 100) / W) * zoom;
  const ox = (w - L * sc) / 2 + panX;
  const oy = (h - W * sc) / 2 + panY;

  ctx.strokeStyle = "#a9b8c8";
  ctx.lineWidth = 2;
  ctx.strokeRect(ox, oy, L * sc, W * sc);

  let x = 0;
  let n = 1;

  s.campate.forEach(c => {
    [0, W].forEach(z => {
      ctx.fillStyle = "#6f7882";
      ctx.fillRect(ox + x * sc - 5, oy + z * sc - 5, 10, 10);

      ctx.fillStyle = "#4a9eff";
      ctx.font = "10px monospace";
      ctx.fillText("P" + n++, ox + x * sc + 7, oy + z * sc - 7);
    });

    ctx.strokeStyle = "#56687c";
    ctx.beginPath();
    ctx.moveTo(ox + x * sc, oy - 12);
    ctx.lineTo(ox + x * sc, oy + W * sc + 12);
    ctx.stroke();

    x += c.interasse;
  });

  [0, W].forEach(z => {
    ctx.fillStyle = "#6f7882";
    ctx.fillRect(ox + L * sc - 5, oy + z * sc - 5, 10, 10);

    ctx.fillStyle = "#4a9eff";
    ctx.fillText("P" + n++, ox + L * sc + 7, oy + z * sc - 7);
  });

  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = "#e55b5b";

  ctx.beginPath();
  ctx.moveTo(ox, oy + W * sc / 2);
  ctx.lineTo(ox + L * sc, oy + W * sc / 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ox + L * sc / 2, oy);
  ctx.lineTo(ox + L * sc / 2, oy + W * sc);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.fillStyle = "#e9eef5";
  ctx.font = "12px monospace";
  ctx.fillText("A-A", ox + L * sc / 2, oy + W * sc / 2 - 8);
  ctx.fillText("B-B", ox + L * sc / 2 + 8, oy + W * sc / 2);
  ctx.fillText("N ↑", ox + 10, oy + 18);
  ctx.fillText(
    "Lunghezza " + L.toFixed(2) + " m",
    ox + L * sc / 2 - 45,
    oy - 25
  );
  ctx.fillText(
    "Luce " + W.toFixed(2) + " m",
    ox + L * sc + 12,
    oy + W * sc / 2
  );
}

export function aggiornaPianta(s) {
  draw(s);
}
