# ClassJourney

Ein lokaler Unterrichtsbildschirm: Tagespläne nach Klasse, Wochentag und Themenblock, feste Jetzt-Markierung, aufwärts laufende Aufträge und thematische Bilder.

**[Windows-Installer](https://github.com/DJufer1/classjourney/releases/latest/download/ClassJourney-Setup-Windows-x64.exe)** · **[Mac-Installer](https://github.com/DJufer1/classjourney/releases/latest/download/ClassJourney-Mac-universal.dmg)**

Windows: Setup ausführen. Mac: DMG öffnen und ClassJourney nach «Programme» ziehen. Der Mac-Installer enthält die App für Intel und Apple Silicon. Die installierte Anwendung funktioniert während des Unterrichts offline.

Die Installer haben derzeit kein Herstellerzertifikat. Der Mac-Build ist ad hoc signiert und nicht von Apple notarisiert; das Betriebssystem kann eine manuelle Freigabe verlangen. Ein vollständig automatisches Mac-Update wird deshalb nicht angeboten.

**[Zusätzlich: portabler Ordner für Windows & Mac](https://github.com/DJufer1/classjourney/releases/latest/download/ClassJourney-Windows-Mac.zip)**

ZIP entpacken, den Ordner auf dem eigenen Computer ablegen und **ClassJourney.html** doppelklicken. Das vollständige Programm läuft lokal im Browser und ohne Internet. Der Ordner lässt sich auch über Teams weitergeben.

[Alle Downloads](https://github.com/DJufer1/classjourney/releases/latest) · [Einzelne HTML-Datei](https://github.com/DJufer1/classjourney/releases/latest/download/ClassJourney.html) · [Online ausprobieren](https://djufer1.github.io/classjourney/)

Klasse, Thema und Wochentag lassen sich über kompakte Dropdowns gemeinsam filtern. Import zeigt nach unten in die Ablage, Export nach oben aus der Ablage.

## Verwenden

- Windows & Mac: Den ZIP-Download vollständig entpacken, den Ordner an einem festen Ort behalten und `ClassJourney.html` öffnen. Kein Konto, kein lokaler Server und keine Installation nötig. Für schnellen Zugriff eine Verknüpfung beziehungsweise ein Alias der HTML-Datei anlegen.
- Die einzelne `ClassJourney.html` kann ebenfalls auf Teams abgelegt und lokal geöffnet werden.
- Die zusätzliche Webversion kann in unterstützten Browsern als App installiert werden; nach dem ersten vollständigen Laden ist sie auch offline nutzbar.
- Die installierte App speichert ihre Sammlung als lokale Datei im festen Benutzerdatenordner «ClassJourney», getrennt von den Programmdateien. Beim ersten Wechsel von Browserdatei oder Webversion zur installierten App die Sammlung exportieren und in der App importieren. Ein Programmupdate übernimmt danach denselben Datenordner.
- Unterrichtsdaten liegen im Browserspeicher des jeweiligen Geräts. Wichtige Pläne als Datei sichern. Kein automatischer Abgleich und keine Übermittlung der Pläne an GitHub.
- «KI-Agent verbinden» und das danebenliegende «?» erklären die Übergabe an die eigene lokale KI. Der Knopf stellt in unterstützten Browsern einen neuen lokalen Unterordner bereit, alternativ eine ZIP-Datei. Darin liegen lesbare Pläne, einzelne Bilder, AGENTS.md, CLAUDE.md und der Skill «Class Journey» im Ordner «Anweisungen KI-Agent». Den Ordner in der KI öffnen, dort den Dateizugriff erlauben und die Startanweisung einfügen. Die Übergabe ist für ClassJourney kostenfrei; der bestehende Tarif der eigenen KI gilt weiterhin. Neue Bilder benötigen deren Bildwerkzeug. In der installierten App gibt es zwei Wege: «Verknüpfen» öffnet ein erkanntes lokales KI-Programm mit dem automatisch gefundenen ClassJourney-Planungsordner; «Startprompt kopieren» bereitet dieselben Dateien vor und kopiert den Prompt. Codex erhält einen neuen Chatentwurf mit Ordner und Prompt, Cursor und VS Code öffnen den Ordner und erhalten den Prompt über die Zwischenablage. Angeforderte Freigaben werden in der KI bestätigt. Nachrichten und Pläne werden nicht automatisch abgeglichen. «KI-Ergebnis laden» übernimmt die von der KI erzeugte Sammlung.

Die Ordneranweisungen werden über [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) sowie eine kopierbare Startanweisung übergeben. Die Auswahl eines Ordners im Browser ersetzt nicht die Dateifreigabe im KI-Agenten.

Der Demo-Tag startet beim Öffnen fünf Minuten nach Unterrichtsbeginn. Seine Uhr läuft unabhängig von der Systemzeit und lässt sich pausieren, neu starten und verstellen. Die Vorschau für echte Pläne ist ein bewusst gewählter Vorbereitungsmodus.

## Sprachen

Die Oberfläche, der Demo-Tag, Startprompts und native Bestätigungen stehen in Deutsch, Englisch, Französisch, Spanisch und Italienisch zur Verfügung. Die Auswahl oben wird lokal gespeichert. Eigene Plantexte werden nicht automatisch übersetzt. Dateinamen und die ausführlichen deutschen Originalanweisungen des Skills bleiben gleich; der KI-Startprompt verlangt Antworten in der gewählten Sprache.

## Aktualisieren

`node scripts/build.mjs` erstellt die Webversion und die einzelne Offline-Datei unter `docs/`. GitHub Pages veröffentlicht `main:/docs`.

`node scripts/package.mjs --out <Zielordner>` erstellt den plattformübergreifenden Programmordner, die ZIP-Datei und eine Prüfsumme. Die ZIP-Datei und die einzelne HTML-Datei werden als GitHub-Release angeboten. Bei einem Update zuerst die eigene Sammlung exportieren, den neuen Programmordner entpacken und die Sammlung dort laden.

In der installierten App: «Updates → Auf Updates prüfen → Update herunterladen → Installer öffnen». Nur neuere reguläre Versionen aus DJufer1/classjourney werden angeboten. Der Download wird auf Vollständigkeit und SHA-256-Prüfsumme geprüft und vor dem Öffnen erneut geprüft. Vor der Installation wird die Sammlung im Benutzerdatenordner unter `backups/` gesichert. Windows: Setup ausführen. Mac: die App in «Programme» ersetzen. Die App installiert sich nicht still im Hintergrund.

Der GitHub-Workflow «Build and verify desktop installers» baut beide Installer. Er lädt den echten bisherigen Installer laut `desktop/test-baseline.json` von GitHub, installiert ihn, speichert eine vollständige Testsammlung mit eigenem Plan und Bildern, installiert/ersetzt mit der aktuellen Version und prüft die unveränderten Daten. Der gleiche Mac-Installer wird auf Apple Silicon und Intel getestet. Erst nach erfolgreichen Tests werden die Installer mit dem portablen Ordner und der Browserdatei als Release veröffentlicht, über den Produktions-Update-Code öffentlich heruntergeladen und erneut geprüft. Ein Prüfbericht liegt beim Release.

Für neue Veröffentlichungen die Versionsnummer in `package.json` und `app-info.json` sowie die Versionspfade im Workflow aktualisieren, die bisherige Version in `desktop/test-baseline.json` eintragen und den Workflow starten (der Release wird als Entwurf angelegt). Die Signierung für die Verteilung benötigt eigene Zertifikate; die Pipeline enthält keine Zugangsdaten. Persönliche Unterrichtssammlungen gehören nicht in dieses öffentliche Repository.

## Quelle und Bilder

Die Browserdatei benötigt keine externen JavaScript-Pakete oder CDNs. Die Desktop-App enthält Electron. Enthalten ist genau ein Demo-Tag mit eigener, pausierbarer Uhr. Eigene und duplizierte Unterrichtstage nutzen beim Öffnen die Gerätezeit. Bildprompts stehen in `assets/image-prompts.json`; für das Ambulanzmotiv wurde die offizielle Fahrzeugreferenz von Schutz & Rettung Zürich verwendet. Thematische Szenen und Symbole dienen der Orientierung und sind keine medizinischen Handlungsanweisungen.

## Lokale Entwicklung

Quellen in `src/`, Beispiel-Sammlung in `content/collection.json`, Skill «Class Journey» in `skill/class-journey/`. Für einen lokalen PWA-Test die erzeugten Dateien über einen lokalen HTTP-Server bereitstellen. Das Öffnen der einzelnen HTML-Datei braucht keinen Server.

Desktop: `npm ci`, `npm run test:native`, `node scripts/build-desktop.mjs --platform win` beziehungsweise `--platform mac` auf einem Mac. Installer liegen unter `dist-native/<Version>/`. Lokale Entwicklung verwendet den getrennten Datenordner «ClassJourney-Development». Die Tests mit installierter App akzeptieren nur einen ausdrücklich angegebenen Test-Datenordner.
