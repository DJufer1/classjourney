# ClassJourney

Ein lokaler Unterrichtsbildschirm: Tagespläne nach Klasse, Wochentag und Themenblock, feste Jetzt-Markierung, aufwärts laufende Aufträge und thematische Bilder.

[Web-App öffnen](https://djufer1.github.io/classjourney/) · [Offline-Datei herunterladen](https://djufer1.github.io/classjourney/ClassJourney.html)

## Verwenden

- Webversion öffnen und im unterstützten Browser als App installieren. Nach dem ersten vollständigen Laden auch offline nutzbar.
- Oder `docs/ClassJourney.html` herunterladen, auf Teams ablegen und lokal im Browser öffnen.
- Unterrichtsdaten liegen im Browserspeicher des jeweiligen Geräts. Wichtige Pläne als Datei sichern. Kein automatischer Abgleich und keine Übermittlung der Pläne an GitHub.
- «Dokumente für lokalen KI Agenten» exportiert lesbare Pläne, einzelne Bilder, AGENTS.md, CLAUDE.md, den Tagesablauf-Skill und Hilfsskripte. Den entpackten Ordner mit der lokalen KI öffnen. Neue Bilder benötigen ein Bildwerkzeug der verwendeten KI.

## Aktualisieren

`node scripts/build.mjs` erstellt die Webversion und die einzelne Offline-Datei unter `docs/`. GitHub Pages veröffentlicht `main:/docs`.

Im Programm führt «Updates → Update auf GitHub hochladen» zum Upload der Programmdateien. Das ist kein Hintergrundzugang zum Konto. Persönliche Unterrichtssammlungen gehören nicht in dieses öffentliche Repository.

## Quelle und Bilder

Die Anwendung benötigt keine externen JavaScript-Pakete. Die enthaltenen Pläne sind Beispiele. Bildprompts stehen in `assets/image-prompts.json`; für das Ambulanzmotiv wurde die offizielle Fahrzeugreferenz von Schutz & Rettung Zürich verwendet. Thematische Szenen und Symbole dienen der Orientierung und sind keine medizinischen Handlungsanweisungen.

## Lokale Entwicklung

Quellen in `src/`, Beispiel-Sammlung in `content/collection.json`, Tagesablauf-Skill in `skill/tagesablauf/`. Für einen lokalen PWA-Test die erzeugten Dateien über einen lokalen HTTP-Server bereitstellen. Das Öffnen der einzelnen HTML-Datei braucht keinen Server.
