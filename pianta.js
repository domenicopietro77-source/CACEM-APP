let cv;
let ctx;

let scala = 1;
let offsetX = 0;
let offsetY = 0;

let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let startOffsetX = 0;
let startOffsetY = 0;

let fitScale = 1;
let fitOffsetX = 0;
let fitOffsetY = 0;

function dimensioniCanvas() {
  if (!cv) return { width: 0, height: 0 };

  const rect = cv.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio || 1;

  if (
    cv.width !== Math.round(width * dpr) ||
    cv.height !== Math.round(height * dpr)
  ) {
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
  }

  return { width, height };
}

function applicaAutoFit(s) {
  if (!cv || !s) return;

  const { width, height } = dimensioniCanvas();

  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const W = Number(s.generale.luce || 0);

  if (!L || !W || !width || !height) return;

  fitScale = Math.min(
    (width - 100) / L,
    (height - 100) / W
  );

  fitScale = Math.max(0.05, fitScale);

  fitOffsetX = (width - L * fitScale) / 2;
  fitOffsetY = (height - W * fitScale) / 2;

  scala = fitScale;
  offsetX = fitOffsetX;
  offsetY = fitOffsetY;
}

export function inizializzaPianta(c) {
  cv = c;
  ctx = c.getContext("2d");

  cv.style.cursor = "grab";
  cv.style.touchAction = "none";

  cv.addEventListener(
    "mousedown",
    e => {
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      startOffsetX = offsetX;
      startOffsetY = offsetY;
      cv.style.cursor = "grabbing";
    }
  );

  window.addEventListener("mousemove", e => {
    if (!dragging) return;

    offsetX = startOffsetX + (e.clientX - dragStartX);
    offsetY = startOffsetY + (e.clientY - dragStartY);

    draw(window.CACEM_STATE);
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;

    dragging = false;
    cv.style.cursor = "grab";
    draw(window.CACEM_STATE);
  });

  cv.addEventListener(
    "mouseleave",
    () => {
      if (!dragging) {
        cv.style.cursor = "grab";
      }
    }
  );

  cv.addEventListener(
    "wheel",
    e => {
      e.preventDefault();

      const rect = cv.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldScale = scala;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.min(
        Math.max(oldScale * factor, fitScale * 0.25),
        fitScale * 12
      );

      /*
       * Keep the model point under the cursor fixed:
       * screen = world * scale + offset.
       */
      offsetX = mouseX - (mouseX - offsetX) * (newScale / oldScale);
      offsetY = mouseY - (mouseY - offsetY) * (newScale / oldScale);
      scala = newScale;

      draw(window.CACEM_STATE);
    },
    { passive: false }
  );

  requestAnimationFrame(() => {
    applicaAutoFit(window.CACEM_STATE);
    draw(window.CACEM_STATE);
  });
}

export function resetPianta() {
  applicaAutoFit(window.CACEM_STATE);
  draw(window.CACEM_STATE);
}

function disegnaPilastro(x, z, label, ox, oy, sc) {
  ctx.fillStyle = "#6f7882";
  ctx.fillRect(
    ox + x * sc - 5,
    oy + z * sc - 5,
    10,
    10
  );

  ctx.fillStyle = "#4a9eff";
  ctx.font = "10px monospace";
  ctx.fillText(
    label,
    ox + x * sc + 7,
    oy + z * sc - 7
  );
}

function draw(s) {
  if (!ctx || !s) return;

  const { width: w, height: h } = dimensioniCanvas();

  if (!w || !h) return;

  const dpr = window.devicePixelRatio || 1;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const W = Number(s.generale.luce || 0);

  if (!L || !W) return;

  /*
   * scala, offsetX and offsetY are the complete viewport transform.
   * The auto-fit values are used only when Reset vista is pressed
   * or the canvas is first initialized.
   */
  const sc = scala;
  const ox = offsetX;
  const oy = offsetY;

  ctx.strokeStyle = "#a9b8c8";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    ox,
    oy,
    L * sc,
    W * sc
  );

  // Sud: P1, P3, P5, P7, P9
  // Nord: P2, P4, P6, P8, P10
  let x = 0;

  s.campate.forEach((campata, index) => {
    const numeroSud = index * 2 + 1;
    const numeroNord = index * 2 + 2;

    disegnaPilastro(
      x,
      0,
      "P" + numeroSud,
      ox,
      oy,
      sc
    );

    disegnaPilastro(
      x,
      W,
      "P" + numeroNord,
      ox,
      oy,
      sc
    );

    ctx.strokeStyle = "#56687c";
    ctx.beginPath();
    ctx.moveTo(ox + x * sc, oy - 12);
    ctx.lineTo(ox + x * sc, oy + W * sc + 12);
    ctx.stroke();

    x += Number(campata.interasse || 0);
  });

  disegnaPilastro(
    L,
    0,
    "P" + (s.campate.length * 2 + 1),
    ox,
    oy,
    sc
  );

  disegnaPilastro(
    L,
    W,
    "P" + (s.campate.length * 2 + 2),
    ox,
    oy,
    sc
  );

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

  ctx.fillText(
    "A-A",
    ox + L * sc / 2,
    oy + W * sc / 2 - 8
  );

  ctx.fillText(
    "B-B",
    ox + L * sc / 2 + 8,
    oy + W * sc / 2
  );

  ctx.fillText(
    "N ↑",
    ox + 10,
    oy + 18
  );

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
  if (!s) return;

  const rect = cv?.getBoundingClientRect();

  /*
   * If the Pianta tab was hidden when the first render happened,
   * its canvas can have a zero-sized layout box. Re-fit as soon
   * as a real visible size becomes available.
   */
  if (rect && rect.width > 0 && rect.height > 0) {
    if (!fitScale || cv.width === 0 || cv.height === 0) {
      applicaAutoFit(s);
    }

    draw(s);
  }
}
