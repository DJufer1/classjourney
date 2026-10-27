# ClassJourney

Ein lokaler Unterrichtsbildschirm: Tagespläne nach Klasse, Wochentag und Themenblock, feste Jetzt-Markierung, aufwärts laufende Aufträge und thematische Bilder.

**[ClassJourney für Windows & Mac herunterladen](https://github.com/DJufer1/classjourney/releases/latest/download/ClassJourney-Windows-Mac.zip)**

ZIP entpacken, den Ordner auf dem eigenen Computer ablegen und **ClassJourney.html** doppelklicken. Das vollständige Programm läuft lokal im Browser und ohne Internet. Der Ordner lässt sich auch über Teams weitergeben.

[Alle Downloads](https://github.com/DJufer1/classjourney/releases/latest) · [Einzelne HTML-Datei](https://github.com/DJufer1/classjourney/releases/latest/download/ClassJourney.html) · [Online ausprobieren](https://djufer1.github.io/classjourney/)

## Verwenden

- Windows & Mac: Den ZIP-Download vollständig entpacken, den Ordner an einem festen Ort behalten und `ClassJourney.html` öffnen. Kein Konto, kein lokaler Server und keine Installation nötig. Für schnellen Zugriff eine Verknüpfung beziehungsweise ein Alias der HTML-Datei anlegen.
- Die einzelne `ClassJourney.html` kann ebenfalls auf Teams abgelegt und lokal geöffnet werden.
- Die zusätzliche Webversion kann in unterstützten Browsern als App installiert werden; nach dem ersten vollständigen Laden ist sie auch offline nutzbar.
- Unterrichtsdaten liegen im Browserspeicher des jeweiligen Geräts. Wichtige Pläne als Datei sichern. Kein automatischer Abgleich und keine Übermittlung der Pläne an GitHub.
- «KI-Agent verbinden» und das danebenliegende «?» erklären die Übergabe an die eigene lokale KI. Der Knopf stellt in unterstützten Browsern einen neuen lokalen Unterordner bereit, alternativ eine ZIP-Datei. Darin liegen lesbare Pläne, einzelne Bilder, AGENTS.md, CLAUDE.md und der Skill «Class Journey» im Ordner «Anweisungen KI-Agent». Den Ordner in der KI öffnen, dort den Dateizugriff erlauben und die Startanweisung einfügen. Die Übergabe ist für ClassJourney kostenfrei; der bestehende Tarif der eigenen KI gilt weiterhin. Neue Bilder benötigen deren Bildwerkzeug. Es gibt keine automatische Agentenverbindung oder Synchronisierung. «KI-Ergebnis laden» übernimmt die von der KI erzeugte Sammlung.

Die Ordneranweisungen werden über [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) sowie eine kopierbare Startanweisung übergeben. Die Auswahl eines Ordners im Browser ersetzt nicht die Dateifreigabe im KI-Agenten.

Der Demo-Tag startet beim Öffnen fünf Minuten nach Unterrichtsbeginn. Seine Uhr läuft unabhängig von der Systemzeit und lässt sich pausieren, neu starten und verstellen. Die Vorschau für echte Pläne ist ein bewusst gewählter Vorbereitungsmodus.

## Aktualisieren

`node scripts/build.mjs` erstellt die Webversion und die einzelne Offline-Datei unter `docs/`. GitHub Pages veröffentlicht `main:/docs`.

`node scripts/package.mjs --out <Zielordner>` erstellt den plattformübergreifenden Programmordner, die ZIP-Datei und eine Prüfsumme. Die ZIP-Datei und die einzelne HTML-Datei werden als GitHub-Release angeboten. Bei einem Update zuerst die eigene Sammlung exportieren, den neuen Programmordner entpacken und die Sammlung dort laden.

Im Programm führt «Updates → Update auf GitHub hochladen» zum Upload der Programmdateien. Das ist kein Hintergrundzugang zum Konto. Persönliche Unterrichtssammlungen gehören nicht in dieses öffentliche Repository.

## Quelle und Bilder

Die Anwendung benötigt keine externen JavaScript-Pakete. Enthalten ist genau ein Demo-Tag mit eigener, pausierbarer Uhr. Eigene und duplizierte Unterrichtstage nutzen beim Öffnen die Gerätezeit. Bildprompts stehen in `assets/image-prompts.json`; für das Ambulanzmotiv wurde die offizielle Fahrzeugreferenz von Schutz & Rettung Zürich verwendet. Thematische Szenen und Symbole dienen der Orientierung und sind keine medizinischen Handlungsanweisungen.

## Lokale Entwicklung

Quellen in `src/`, Beispiel-Sammlung in `content/collection.json`, Skill «Class Journey» in `skill/class-journey/`. Für einen lokalen PWA-Test die erzeugten Dateien über einen lokalen HTTP-Server bereitstellen. Das Öffnen der einzelnen HTML-Datei braucht keinen Server.
