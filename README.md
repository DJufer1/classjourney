# ClassJourney im Browser

[ClassJourney öffnen](https://djufer1.github.io/classjourney/)

Unterrichtstage planen, bearbeiten und im Unterricht anzeigen. Die Website benötigt keine ClassJourney-Installation. Pläne, Bilder und Sicherungen bleiben lokal. Enthalten ist ausschliesslich ein Demo-Tag.

## Einmal einrichten

1. In Chrome oder Edge «KI-Agent verbinden» öffnen und «Startanweisung kopieren» wählen. Die Anweisung in die vorhandene lokale KI einfügen.
2. Die KI legt einen lokalen Ordner an, schreibt den vollständigen Skill und die Referenzen hinein, prüft ihren Zugriff und gibt den vollständigen Ordnerpfad zum Kopieren zurück.
3. Den Pfad in ClassJourney einfügen, «Ordner auswählen und freigeben» klicken und im Browserdialog denselben Ordner auswählen. Der Browser prüft die Vorbereitung, stellt die aktuelle Sammlung bereit und merkt sich die Verbindung.

Ein eingefügter Pfad allein erteilt keine Dateiberechtigung. Browser und KI benötigen jeweils ihren eigenen Zugriff. Die Startanweisung enthält den vollständigen Skill; ein zusätzlicher Skill-Download ist nicht nötig. Der KI-Agent benötigt Dateiwerkzeuge und für individuelle neue Bilder ein Bildwerkzeug.

Bestehende Browserordner lassen sich mit Pfad und Ordnerauswahl erneut verbinden. Browserdaten können gelöscht werden, ohne die Sammlung im lokalen Ordner zu löschen. Der Datenordner einer installierten ClassJourney-App wird bewusst nicht als Website-Ordner verwendet.

## Lokal speichern und mit der KI planen

- Die KI bearbeitet data/plans.json sowie neue Bilddateien unter assets/.
- Bildpfade sind relativ zum ClassJourney-Ordner. Bilder werden einzeln gespeichert; beide vorgefertigten 3×2-Icon-Atlanten bleiben erhalten.
- Nach Abschluss schreibt die KI die vollständige kompakte Plandatei atomar nach output/Sammlung.classjourney.json. Kein Python-Bauschritt ist nötig.
- Die geöffnete Website übernimmt fertige Ausgaben automatisch und bestätigt sie in output/BROWSER-Status.json. Im Planeditor wartet sie; bei Konflikten bleiben beide Fassungen erhalten. Fehlende Pläne in einer KI-Ausgabe löschen keine Tage.
- Die Website schreibt ihre Sammlung nach data/browser-collection.classjourney.json. Sicherungen unter backups/ referenzieren dieselben unveränderlichen Bilddateien. Bilddateien daher nicht unabhängig von den Sicherungen löschen.
- Import und Export einer vollständigen Sammlungsdatei bleiben zum bewussten Weitergeben erhalten. Die Website lädt keine persönlichen Daten zu GitHub hoch.

Die Ordnerverbindung benötigt Chrome oder Edge auf dem Computer. Firefox und Safari können Dateiimport verwenden. Geschlossene oder pausierte Browserseiten überwachen keine Ordner; beim Wiederöffnen wird nachgeholt. Eine abgelaufene Ordnerfreigabe wird durch einen bewussten Klick erneuert.

## Bilder und Offline-Nutzung

Die Website enthält drei Hintergründe (Lernweg, Ressourcen, Pflege) mit 1600 × 900 Pixeln. Alle zwölf vorhandenen Icons sind in unveränderter Originalauflösung erhalten; die WebP-Atlanten sind pixelgenau verlustfrei. Die Starter-Sammlung schrumpft von 19,69 auf 3,63 MB, die Website auf rund 4,15 MB.

Der Service Worker speichert die Anwendung nach dem ersten vollständigen Online-Aufruf. Unter «Website und Offline-Nutzung» wird der bestätigte Offline-Status angezeigt. Updates werden erst durch erneutes Öffnen oder bewusstes Neuladen aktiviert; die Unterrichtsansicht lädt nicht ungefragt neu. Gelöschte Browserdaten können einen erneuten Online-Aufruf nötig machen.

## Entwicklung und Veröffentlichung

Die Website wird aus den gemeinsamen Unterrichtsquellen sowie src/browser/ gebaut. content/web-collection.json enthält ausschliesslich optimierte Demodaten. Der Website-Skill wird aus dem gemeinsamen Skill plus src/browser/workspace-protocol.md erzeugt und vollständig in den Einstiegsprompt eingebettet.

- npm ci
- npm run build
- npm test
- npm run test:web (Playwright und Chrome erforderlich; alternativ CLASSJOURNEY_PLAYWRIGHT_MODULE und CHROME_EXECUTABLE setzen)
- node scripts/preview-web.cjs für die lokale Entwicklung

GitHub Pages veröffentlicht main:/docs. Der Website-Bau verändert docs/index.html und docs/sw.js. docs/version.json und docs/ClassJourney.html bleiben für bestehende Desktop-Installationen kompatibel. Die Website benötigt zur Laufzeit weder Node noch Python noch einen lokalen Server.

Zur reproduzierbaren Asset-Optimierung: python scripts/prepare-web-assets.py --source docs/ClassJourney.html --output tmp/optimized-assets; die geprüfte starter-collection.json anschliessend als content/web-collection.json übernehmen. Das Skript akzeptiert nur eine Sammlung mit genau einem Demo-Tag und prüft die Icons pixelgenau.

Die Browserprüfungen testen den echten Chromium-Dateihandle-Vertrag mit einem isolierten Browser-Testordner, inklusive falscher Pfade, Konflikte, Berechtigungen, kompakter Speicherung und Offline-Neustart. Der native Betriebssystemdialog ist nicht Teil dieses automatisierten Tests.

Informationen zur bereits bestehenden installierbaren Version stehen in [DESKTOP.md](DESKTOP.md). Private Unterrichtspläne gehören nicht in dieses Repository.
