const IDS = ["prospetto1", "prospetto2", "prospetto3", "prospetto4"];

function setupCanvas(canvas) {
  if (!canvas) return null;

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

function pilastro(ctx, x, base, top, label) {
  const width = 10;

  ctx.fillStyle = "#87929d";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.2;
  ctx.fillRect(x - width / 2, top, width, base - top);
  ctx.strokeRect(x - width / 2, top, width, base - top);

  ctx.fillStyle = "#26333f";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x, top - 7);
  ctx.textAlign = "left";
}

function quotaVerticale(ctx, x, y1, y2, label) {
  ctx.strokeStyle = "#52606d";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.moveTo(x - 5, y1);
  ctx.lineTo(x + 5, y1);
  ctx.moveTo(x - 5, y2);
  ctx.lineTo(x + 5, y2);
  ctx.stroke();

  // Testo orizzontale, accanto alla linea di quota.
  ctx.fillStyle = "#344054";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText(label, x + 9, (y1 + y2) / 2 + 3);
}

function quotaOrizzontale(ctx, x1, x2, y, label) {
  ctx.strokeStyle = "#52606d";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.moveTo(x1, y - 5);
  ctx.lineTo(x1, y + 5);
  ctx.moveTo(x2, y - 5);
  ctx.lineTo(x2, y + 5);
  ctx.stroke();

  ctx.fillStyle = "#344054";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, (x1 + x2) / 2, y - 9);
  ctx.textAlign = "left";
}

function disegnaCopertura(ctx, x1, x2, eave, ridge) {
  const mid = (x1 + x2) / 2;

  ctx.strokeStyle = "#344054";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(x1, eave);
  ctx.lineTo(mid, ridge);
  ctx.lineTo(x2, eave);
  ctx.stroke();
}

function disegnaProspetto(canvas, stato, indice) {
  const setup = setupCanvas(canvas);

  if (!setup || !stato) return;

  const { ctx, width, height } = setup;

  const lunghezza = stato.campate.reduce(
    (sum, campata) => sum + Number(campata.interasse || 0),
    0
  );

  const luce = Number(stato.generale.luce || 0);
  const altezzaGronda = Number(
    stato.generale.altezzaPilastro || 0
  );
  const pendenza = Number(
    stato.generale.pendenzaCopertura || 0
  );

  // 1 e 3 = facciate lunghe; 2 e 4 = facciate corte.
  const facciataLunga = indice === 0 || indice === 2;
  const larghezza = facciataLunga ? lunghezza : luce;
  const salitaColmo = luce * pendenza / 200;
  const altezzaColmo = altezzaGronda + salitaColmo;

  const margineLaterale = 180;
  const margineVerticale = 105;

  const scala = Math.max(
    0.05,
    Math.min(
      (width - margineLaterale) / Math.max(larghezza, 1),
      (height - margineVerticale) / Math.max(altezzaColmo, 1)
    )
  );

  const disegnoLarghezza = larghezza * scala;
  const x0 = (width - disegnoLarghezza) / 2;
  const base = height - 62;
  const gronda = base - altezzaGronda * scala;
  const colmo = base - altezzaColmo * scala;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  // Il lato Nord/Ovest è la vista speculare del lato Sud/Est.
  const speculare = indice === 2 || indice === 3;
  const xVista = valore => {
    if (!speculare) return x0 + valore * scala;
    return x0 + disegnoLarghezza - valore * scala;
  };

  // Linea di riferimento alla base.
  ctx.strokeStyle = "#9aa6b2";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, base);
  ctx.lineTo(x0 + disegnoLarghezza, base);
  ctx.stroke();

  // Copertura a due falde, presente in tutti e quattro i prospetti.
  const xSinistra = xVista(0);
  const xDestra = xVista(larghezza);
  const xCentro = x0 + disegnoLarghezza / 2;

  ctx.strokeStyle = "#344054";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(xSinistra, gronda);
  ctx.lineTo(xCentro, colmo);
  ctx.lineTo(xDestra, gronda);
  ctx.stroke();

  if (facciataLunga) {
    // Facciate Sud/Nord: tutti i pilastri della facciata lunga.
    let posizione = 0;

    pilastro(
      ctx,
      xVista(posizione),
      base,
      gronda,
      "P1"
    );

    stato.campate.forEach((campata, i) => {
      posizione += Number(campata.interasse || 0);

      pilastro(
        ctx,
        xVista(posizione),
        base,
        gronda,
        "P" + (i + 2)
      );
    });
  } else {
    // Facciate Est/Ovest: solo i due pilastri d'angolo.
    pilastro(ctx, xVista(0), base, gronda, "P1");
    pilastro(ctx, xVista(larghezza), base, gronda, "P2");
  }

  quotaVerticale(
    ctx,
    x0 + disegnoLarghezza + 30,
    base,
    gronda,
    "h gronda " + altezzaGronda.toFixed(2) + " m"
  );

  quotaVerticale(
    ctx,
    x0 + disegnoLarghezza + 30,
    base,
    colmo,
    "h colmo " + altezzaColmo.toFixed(2) + " m"
  );

  quotaOrizzontale(
    ctx,
    x0,
    x0 + disegnoLarghezza,
    base + 28,
    (facciataLunga ? "Lunghezza " : "Luce ") +
      larghezza.toFixed(2) +
      " m"
  );

  const nomi = ["Sud", "Est", "Nord", "Ovest"];

  ctx.fillStyle = "#26333f";
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(
    "PROSPETTO " + (indice + 1) + " · " + nomi[indice],
    10,
    18
  );
}

export function inizializzaProspetti() {}

export function aggiornaProspetti(stato) {
  if (!stato) return;

  IDS.forEach((id, indice) => {
    disegnaProspetto(
      document.getElementById(id),
      stato,
      indice
    );
  });
}

export function resetProspetto() {
  aggiornaProspetti(window.CACEM_STATE);
}
