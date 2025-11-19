# Gym App (Expo SDK 54)

Native Expo + React Native App für Android (Expo Go). Diese Version bündelt Home, Trainingsplaner, Workout-Logger, Ernährung und Profil im selben Flow mit einem premium UI-Design. Projekt ist auf Expo SDK 54 angehoben (kompatibel mit der aktuellen Expo Go).

## Installation

```bash
npm install
npm run start
```

Falls du vorher SDK 50 installiert hattest: Cache leeren (`expo start -c`) und einmal `npm install` frisch ausführen, damit die neuen 54er Pakete geladen werden. Scanne den QR-Code mit Expo Go 54 oder starte `npm run android`, sobald dein Android SDK/Emulator bereit ist.

## Highlights

- **Home** mit Hero-CTA, Kalender-Statistiken und History-Feed.
- **Planer** mit Splits + interaktivem Körpermodell (Wähle Zonen, generiere Vorschläge).
- **Nutrition**: Makros, Mikros & Food-Log mit Such-Modal.
- **Stats**: Fortschritt, Volumen-Chart und Übung-Insights samt Details.
- **Workout-Logger** mit Timer, Satz-Tracking und dynamischem Set/Übung-Management.

Passe `App.js` an, um weitere Übungen, Lebensmittel oder Routinen hinzuzufügen.
