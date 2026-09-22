# CACEM Configuratore Modulare

Prima implementazione modulare del configuratore AEC CACEM.

## Avvio

Il progetto principale usa Vite. Dalla root:

```
npm install
npm run dev
```

Aprire quindi la pagina del configuratore modulare esposta da Vite.

## Moduli

- modello.js: stato e schema dati
- regole.js: RegoleValidator e vincoli
- scena3d.js: Three.js
- viste2d.js: pianta/prospetto/sezione
- distinta.js: BOM e peso teorico
- export.js: JSON/CSV/DXF base
- ui.js: binding dei parametri
- main.js: orchestrazione

## Semplificazioni

La geometria è volutamente parametrica e approssimata. Non rappresenta ancora le geometrie produttive reali CACEM ricavate dalle schede DXF. Le quote e i pesi sono preliminari; non sostituiscono verifiche strutturali.

Il motore delle regole è predisposto per successive regole di compatibilità tra elementi reali CACEM.

## Esempio

`esempio-60x30.json` contiene un capannone 60 x 30 m con 4 campate da 15 m.

## DXF

L'export iniziale genera una pianta DXF con LINE e assi di campata. Il writer dovrà essere esteso con LWPOLYLINE, sezioni, quote e geometrie della libreria CACEM.