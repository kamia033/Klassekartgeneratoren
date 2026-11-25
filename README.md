# Klassekartgenerator

En nettbasert generator for å lage, administrere og eksportere klassekart. Appen er utviklet for lærere som raskt vil plassere elever, ta hensyn til samarbeid og soner, og bruke samme elevplassering i grupper.

## Funksjoner

### Klasser og elever

- Opprett, last inn og slett flere klasser.
- Registrer elevnavn, ett per linje.
- Marker elever som fraværende uten å fjerne dem fra klassen.
- Rediger elevnavn direkte i elevlisten.
- Sett enkelte elever fast til sin nåværende plass.
- Brukerens sist valgte klasse lastes automatisk ved neste besøk.

### Klassekart

- Arbeid med to alternative kart per klasse.
- Legg til enkeltpulter, pultegrupper og rundbord.
- Legg til tavle og egne merkelapper.
- Marker plasser som utilgjengelige.
- Zoom, panorer og vis kartet i fullskjerm.
- Angre og gjør om endringer.
- Vis stoler ved pultene.
- Velg mellom flere fargetemaer.
- Bruk lik tekststørrelse på alle elevnavn.

### Tilfeldig plassering

- Fordel tilstedeværende elever automatisk.
- Behold grupper av elever mellom de to kartene.
- Valgfri kaotisk animasjon bytter navnene raskt og deretter stadig saktere før sluttplasseringen vises.
- Animasjonen endrer bare visningen; mellomresultatene lagres ikke.

### Begrensninger og ønsker

Aktiver **Vis avansert** for å åpne elevens innstillinger:

- Velg soner eleven kan plasseres i.
- Bestem hvilke elever eleven ikke skal sitte ved siden av.
- Sett elever sammen på samme bord eller sammenhengende pultgruppe.
- Lås eleven til nåværende plass.

Soneplassering, «unngå»-valg og «sett sammen»-valg brukes som føringer når elevene plasseres.

### Grupper

- Generer grupper etter ønsket gruppestørrelse eller antall grupper.
- Ta hensyn til elever som skal unngå hverandre.
- Hold ekstra elever i en separat gruppe.
- Velg gruppeleder tilfeldig.
- Slå gruppeanimasjon av eller på.

### Eksport

Klassekart kan:

- kopieres til utklippstavlen
- lastes ned som PNG-bilde

Eksporten inkluderer hele det innholdsrike området på kartet. Når stoler vises, får eksportbildet ekstra margin slik at stolene ikke blir beskåret.

Gruppesidens innhold kan også kopieres eller lastes ned som bilde.

## Lagring

Appen bruker nettleserens `localStorage` og krever ingen bruker- eller serverkonto.

Dette lagres automatisk:

- klasser, elevlister og kart
- elevpreferanser og sonevalg
- visnings- og gruppeinnstillinger
- sist valgte klasse, fane, kart og visningsmodus

Dataene lagres lokalt i nettleseren. De følger derfor ikke automatisk mellom ulike enheter eller nettlesere. Hvis lokal lagring er skadet, vises en feilmelding med mulighet for å slette de lagrede dataene.

## Kjøre lokalt

### Krav

- Node.js
- npm

### Installasjon

```bash
npm install
```

### Utvikling

```bash
npm run dev
```

Vite viser lokal adresse i terminalen.

### Produksjonsbygg

```bash
npm run build
```

Det ferdige bygget legges i `dist`.

### Forhåndsvis produksjonsbygg

```bash
npm run preview
```

## Teknologi

- React
- TypeScript
- Vite
- Canvas 2D
- `html2canvas` for eksport av gruppevisningen
- ESLint

## Prosjektstruktur

```text
src/
  components/
    Canvas/            Karttegning og verktøylinje
    Layout/            Hovedvisning og kontrollpanel
    UI/                Menyer og varsler
  context/             Delt applikasjonstilstand
  hooks/               Gjenbrukbar lokal lagring
  types/               TypeScript-typer
```

## Linting

```bash
npm run lint
```
