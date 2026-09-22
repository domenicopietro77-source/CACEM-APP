import { catalogo } from "./catalogo.js";
import { calcolaDerivati, salvaStato } from "./modello.js";
import { aggiornaDistinta } from "./distinta.js";

let stato;
let change = () => {};

const $ = id => document.getElementById(id);

const GENERAL_NUMBER_INPUTS = [
  "luce",
  "altezzaPilastro",
  "pendenzaCopertura",
  "altezzaInterpiano",
  "portataCarroponte"
];

const PILASTRO_NUMBER_INPUTS = [
  "pilastroBase",
  "pilastroAltezzaSezione"
];

export function inizializzaUI(s, onChange) {
  stato = s;
  change = onChange;

  renderUI();

  GENERAL_NUMBER_INPUTS.forEach(id => {
    $(id).addEventListener("input", () => {
      stato.generale[id] = Number($(id).value);
      salvaStato(stato);
      change(stato);
    });
  });

  /*
   * The pillar section is defined by two independent dimensions.
   * There is intentionally no pilastroTipo select anymore.
   */
  PILASTRO_NUMBER_INPUTS.forEach(id => {
    $(id).addEventListener("input", () => {
      if (id === "pilastroBase") {
        stato.pilastri.base = Number($(id).value);
      }

      if (id === "pilastroAltezzaSezione") {
        stato.pilastri.altezzaSezione = Number($(id).value);
      }

      salvaStato(stato);
      change(stato);
    });
  });

  ["interpiano", "carroponte"].forEach(id => {
    $(id).addEventListener("change", () => {
      stato.generale[id] = $(id).checked;
      change(stato);
    });
  });

  ["traveTipo", "tegoloTipo"].forEach(id => {
    $(id).addEventListener("change", () => {
      if (id === "traveTipo") {
        stato.travi.tipoId = $(id).value;
      }

      if (id === "tegoloTipo") {
        stato.copertura.tegoloId = $(id).value;
      }

      change(stato);
    });
  });

  ["pannelloTipo", "pannelloSpessore", "pannelloFinitura"].forEach(id => {
    $(id).addEventListener("change", () => {
      const key =
        id === "pannelloTipo"
          ? "tipo"
          : id === "pannelloSpessore"
            ? "spessore"
            : "finitura";

      stato.pannelli[key] =
        id === "pannelloSpessore"
          ? Number($(id).value)
          : $(id).value;

      change(stato);
    });
  });

  $("addCampata").onclick = () => {
    stato.campate.push({
      id: stato.campate.length + 1,
      interasse: 15
    });

    renderUI();
    change(stato);
  };

  $("removeCampata").onclick = () => {
    if (stato.campate.length > 1) {
      stato.campate.pop();
      renderUI();
      change(stato);
    }
  };
}

export function renderUI() {
  const g = stato.generale;

  GENERAL_NUMBER_INPUTS.forEach(id => {
    $(id).value = g[id];
  });

  $("pilastroBase").value =
    stato.pilastri.base;

  $("pilastroAltezzaSezione").value =
    stato.pilastri.altezzaSezione;

  $("interpiano").checked = g.interpiano;
  $("carroponte").checked = g.carroponte;

  for (const [id, list, selected] of [
    ["traveTipo", catalogo.travi, stato.travi.tipoId],
    ["tegoloTipo", catalogo.copertura, stato.copertura.tegoloId]
  ]) {
    $(id).innerHTML = list
      .map(
        x =>
          `<option value="${x.id}">${x.id} · ${x.nome || ""}</option>`
      )
      .join("");

    $(id).value = selected;
  }

  $("pannelloTipo").value =
    stato.pannelli.tipo;

  $("pannelloSpessore").value =
    stato.pannelli.spessore;

  $("pannelloFinitura").value =
    stato.pannelli.finitura;

  $("campateList").innerHTML =
    stato.campate
      .map(
        (c, i) =>
          `<div class="campata">
            <label>
              Campata ${i + 1}
              <input
                data-i="${i}"
                type="number"
                step=".1"
                value="${c.interasse}"
              >
            </label>
            <span>m</span>
          </div>`
      )
      .join("");

  document
    .querySelectorAll("#campateList input")
    .forEach(input => {
      input.oninput = () => {
        stato.campate[
          Number(input.dataset.i)
        ].interasse =
          Number(input.value) || 1;

        change(stato);
      };
    });
}

export function aggiornaRisultati(s) {
  const d = calcolaDerivati(s);

  $("rLunghezza").textContent =
    d.lunghezza.toFixed(2) + " m";

  $("rSuperficie").textContent =
    d.superficie.toFixed(2) + " m²";

  $("rVolume").textContent =
    d.volumi.totale.toFixed(2) + " m³";

  $("rPeso").textContent =
    d.peso.toFixed(2) + " t";

  $("rPilastri").textContent =
    2 * (s.campate.length + 1);

  aggiornaDistinta(s);
}

export function mostraStatus(m) {
  $("status").textContent = m;
}
