const ids = ["sezioneAA", "sezioneBB"];

const VERTICAL_EXAGGERATION_BB = 2.5;

export function inizializzaSezioni() {}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  return { ctx, width, height };
}

function sec(canvas, s, aa) {
  const { ctx, width: w, height: h } = setupCanvas(canvas);

  const L = s.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );
  const W = Number(s.generale.luce || 0);
  const H = Number(s.generale.altezzaPilastro || 0);
  const rise = W * Number(s.generale.pendenzaCopertura || 0) / 200;

  const baseHeight = 25;
  const topMargin = 72;
  const sideMargin = 70;

  const C = aa ? L : W;
  const visualTop = aa
    ? H
    : H + rise * VERTICAL_EXAGGERATION_BB;

  const scaleX = (w - sideMargin * 2) / C;
  const scaleY = (h - baseHeight - topMargin) / visualTop;
  const sc = Math.max(0.05, Math.min(scaleX, scaleY));

  const verticalScale = aa
    ? 1
    : VERTICAL_EXAGGERATION_BB;

  const ox = (w - C * sc) / 2;
  const base = h - baseHeight;
  const roofY = y => {
    const realHeight = aa ? y : H + (y - H) * verticalScale;
    return base - realHeight * sc;
  };

  ctx.strokeStyle = "#778596";
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(ox, base);
  ctx.lineTo(ox + C * sc, base);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = "#c2ccd7";
  ctx.lineWidth = 2;

  if (aa) {
    let xx = ox;

    ctx.beginPath();

    for (let i = 0; i <= s.campate.length; i++) {
      ctx.moveTo(xx, base);
      ctx.lineTo(xx, base - H * sc);

      if (i < s.campate.length) {
        xx += Number(s.campate[i].interasse || 0) * sc;
      }
    }

    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ox, base - H * sc);
    ctx.lineTo(ox + C * sc, base - H * sc);
    ctx.stroke();
  } else {
    const leftY = roofY(H);
    const ridgeY = roofY(H + rise);
    const rightY = roofY(H);

    ctx.beginPath();
    ctx.moveTo(ox, base - H * sc);
    ctx.lineTo(ox, base);
    ctx.moveTo(ox + C * sc, base - H * sc);
    ctx.lineTo(ox + C * sc, base);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(ox, leftY);
    ctx.lineTo(ox + C * sc / 2, ridgeY);
    ctx.lineTo(ox + C * sc, rightY);
    ctx.stroke();

    // Reference line at gronda, so the roof rise is easy to read.
    ctx.strokeStyle = "#8997a7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, base - H * sc);
    ctx.lineTo(ox + C * sc, base - H * sc);
    ctx.stroke();
  }

  ctx.fillStyle = "#dce5ee";
  ctx.font = "10px monospace";

  if (aa) {
    ctx.fillText(
      "SEZIONE A-A",
      10,
      28
    );

    ctx.fillText(
      "Longitudinale · " + L.toFixed(2) + " m",
      10,
      45
    );
  } else {
    ctx.fillText(
      "SEZIONE B-B",
      10,
      28
    );

    ctx.fillText(
      "Trasversale · luce " + W.toFixed(2) + " m · scala verticale ×" +
        VERTICAL_EXAGGERATION_BB.toFixed(1),
      10,
      45
    );
  }
}

export function aggiornaSezioni(s) {
  sec(
    document.getElementById(ids[0]),
    s,
    true
  );

  sec(
    document.getElementById(ids[1]),
    s,
    false
  );
}

export function resetSezioni() {
  aggiornaSezioni(window.CACEM_STATE);
}
