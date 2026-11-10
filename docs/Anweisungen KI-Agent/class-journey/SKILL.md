---
name: class-journey
description: "Erstellt aus Unterrichtsunterlagen und Klassen-Lektionszeiten mehrere Unterrichtstage für den ClassJourney: zeitliche Planung, thematisch neu generierte Symbole und Reisehintergründe sowie Einfügen in die vorhandene lokale Sammlung. Verwenden beim Aufruf «Class Journey», «Classroom Journey», «ClassJourney» oder «Tagesablauf» oder beim Vorbereiten und Ergänzen dieser Classroomscreen-Dateien."
---

# Class Journey / Classroom Journey – Tagespläne für ClassJourney

Erstelle fertig nutzbare Unterrichtstage aus der Feinplanung und den Unterlagen. Erhalte die vorhandene Anwendung, ihre Gestaltung und alle nicht betroffenen Pläne. Sprache: Deutsch (Schweiz). Die Klasse, der Themenblock und die Unterrichtszeiten kommen aus den Angaben des Nutzers, nicht aus den enthaltenen Beispielplänen.

Bei einer Verknüpfung oder einem Startprompt lies diese vollständige Anweisung und die für den Auftrag relevanten Referenzen. Prüfe den Zugriff auf den im Prompt genannten ClassJourney-Ordner und fordere fehlende Freigaben über dein KI-Werkzeug an. Führe danach die hier beschriebenen Schritte für den Planungsauftrag aus. Fehlen Unterrichtsunterlagen, Klasse oder Lektionen, frage gezielt danach. Die Anweisungsdatei selbst verändert keine Werkzeugberechtigungen.

## Gespeicherte Standard-Lektionszeiten

Für die Default-Version und die Zusammenarbeit mit D. Jufer gelten die zehn Zeitfenster in [references/LEKTIONEN.json](references/LEKTIONEN.json). Nutze sie ohne erneute Nachfrage, wenn Lektionsnummern genannt werden. Wähle nur die Lektionen, die der betreffenden Klasse an diesem Tag zugeordnet sind; das Standardraster bedeutet nicht, dass jede Klasse alle zehn Lektionen besucht. Wenn diese Auswahl fehlt, frage nach Klasse, Tag und Lektionsnummern. Ausdrücklich abweichende Zeiten haben Vorrang.

Lektion 9 enthält das vom Nutzer angegebene Sternchen; seine Bedeutung wurde nicht angegeben. Für Lektion 10 ist das Ende 18:00 bestätigt; der Beginn 17:15 wurde aus 45 Minuten abgeleitet und bleibt eine gekennzeichnete Annahme. Die Pausen einschliesslich Mittagspause ergeben sich aus den Lücken der ausgewählten Lektionen. In einer einzelnen HTML-Datei ist das Raster zusätzlich im Element `default-lessons` enthalten.

## Demo-Tag und echte Unterrichtstage

Die Default-Version enthält genau einen «Demo-Tag» (`id: demo-tag`, `isDemo: true`). Seine eigene laufende Uhr startet unabhängig von Datum und Gerätezeit und lässt sich pausieren, verstellen und neu starten. Er dient nur zum Ausprobieren. Erhalte ihn, sofern seine Änderung oder Entfernung nicht beauftragt ist; lege keine weiteren Beispieltage an. Alle für die Lehrperson neu erstellten oder duplizierten Unterrichtstage erhalten `isDemo: false` und `example: false`. Sie öffnen regulär mit der Systemzeit des Geräts; Datum und Wochentag ordnen den Plan zu, verändern aber nicht die Geräteuhr. Die ausdrücklich aktivierte Vorschau bleibt zum Vorbereiten verfügbar.

## Eingaben und Planung

1. Lies die übergebenen Unterlagen und die bestehende Sammlung. Erfrage nur fehlende Informationen, die für die Planung nötig sind: Klasse, Wochentag beziehungsweise Datum und die zugehörigen Lektionsnummern oder ausdrücklich abweichenden Zeitfenster. Verwende sonst das gespeicherte Standardraster. Bereits bekannte Stundenraster derselben Klasse am selben Wochentag dürfen wiederverwendet werden; mache ihre Verwendung erkennbar. Ein fehlendes Datum ist erlaubt, wenn ein Wochentag vorliegt.
2. Erhalte die didaktische Reihenfolge, die Ziele und ausdrücklich angegebenen Dauern. Wo Dauern fehlen, schlage realistische Dauern vor und kennzeichne sie bei der Übergabe als geschätzt.
3. Jeder Abschnitt erhält einen klaren Titel, eine Dauer in ganzen Minuten, gegebenenfalls einen kurzen handlungsorientierten Auftrag und ein passendes Bild. Der Text soll auf einer projizierten Karte lesbar bleiben: Titel möglichst 2–6 Wörter, Auftrag meist 1–2 kurze Sätze. Keine Lösungen, Lehrpersonennotizen oder personenbezogenen Falldaten auf den öffentlichen Screen übernehmen.
4. Lücken zwischen den Lektionsfenstern sind feste Pausen. Aufträge können über eine solche Pause hinweg weiterlaufen; die App stellt Fortsetzungen dar. Zusätzliche kurze Pausen innerhalb einer Lektion sind eigene Abschnitte mit Dauer.
5. Verteile Aufträge in der festgelegten Reihenfolge auf die verfügbaren Unterrichtsminuten. Nichts ungefragt kürzen, streichen oder ans Unterrichtsende anpassen. Was nicht hineinpasst, bleibt am Ende erhalten und wird von der App rot dargestellt. Weise bei der Übergabe knapp auf den Überhang hin. Der Nutzer kann jede Dauer selbst verändern; folgende Aufträge verschieben sich entsprechend.
6. Lege pro vorbereitetem Tag einen eigenen Plan an. Klasse, Wochentag/Datum und Themenblock sind unabhängige Merkmale. Derselbe Plan muss unter beiden Ordnungen auffindbar sein, ohne doppelt angelegt zu werden. Übernehme unveränderte Plan- und Auftragskennungen; erzeuge für neue Einträge neue eindeutige Kennungen. Setze `updatedAt` bei jedem neu angelegten oder tatsächlich geänderten Plan auf aktuelle Unix-Millisekunden, auch bei einem neu gestalteten Hintergrund; lasse unberührte Pläne unverändert. Neue Hintergründe erhalten eigene Kennungen, damit andere Tage ihr Bild behalten.

## Neue thematische Bilder erstellen

Die Bildwelt wird aus den konkreten Unterlagen abgeleitet und orientiert sich an der Schweiz. Die zwölf vorgefertigten Icons bleiben erhalten. Für passende wiederkehrende Tätigkeiten (Einstieg, Aufgabe, Pause, Arbeiten, Austausch, Sicherung, Gesundheit, Hygiene, Pflege, Mobilität, Ressourcen, Ruhe) dürfen sie verwendet werden. Individuelle thematische Bilder nur ergänzen, wenn das Thema sie erfordert oder die Lehrperson sie wünscht. Die Standardmotive bleiben für die manuelle Gestaltung im Programm verfügbar.

### Einheitlicher Stil

- Deutlich comicartig und verspielt für Jugendliche und FaGe-Lernende: eine moderne Graphic-Novel-Bildwelt mit markanten dunkelblauen Tuschekonturen, leicht handgezeichneten Formen, ausdrucksstarken Silhouetten und klaren Schatten in zwei bis drei Farbstufen. Einzelne Schraffuren oder Rasterpunkte dürfen den Bildrändern Charakter geben. Die Darstellung soll als gezeichneter Comic erkennbar sein; ein nüchterner Raum in Pastellfarben oder ein glattes 3D-Papiermodell genügt nicht.
- Verwende kräftiges Kobaltblau, Petrol/Türkis, Apricot, Flieder und Sonnengelb mit wenigen abgestimmten Hauptfarben pro Szene. Dynamische Perspektiven, etwas überzeichnete Gegenstände und ein bis zwei witzige, zum Thema gehörende Details sind willkommen. Fiktive Jugendliche oder junge Erwachsene dürfen in passenden Alltagssituationen vorkommen. Keine kindlichen Kulleraugen, keine identifizierbaren Personen aus Fällen und keine respektlosen Gags bei Pflege- oder Notfallthemen.
- Symbole, Hintergrund und die vorhandenen Comic-Panels der App sollen zusammenpassen. Die Stimmung darf lebendig und überraschend sein; die Auftragsflächen bleiben hell, ruhig und kontrastreich. Keine Neon-Regenbogenmischung, kein Konfetti, keine Muster hinter dem Lesetext. Rot bleibt als Warnfarbe für zeitliche Überhänge frei.
- Prüfe jedes Bild sichtbar: Ist der Comicstil klar erkennbar? Besitzt die Szene Charakter und ein konkretes Themenmotiv? Bleiben Auftrag, Uhr und Jetzt-Markierung auf dem zusammengesetzten Screen gut lesbar? Bei austauschbaren oder zu nüchternen Ergebnissen den Bildprompt gezielt überarbeiten.

### Symbole pro Abschnitt

- Leite für jeden unterschiedlichen Abschnitt ein konkretes Bildmotiv aus Thema und Tätigkeit ab: beispielsweise Hände/Wasser bei Hygiene, eine Pflanze als Ressourcenmetapher, eine Brücke oder Sprechblasen bei Kommunikation. Keine austauschbaren Puzzle-Symbole für alle Fachthemen.
- Verwende passende vorhandene Icons. Erstelle zusätzlich benötigte individuelle Motive mit dem verfügbaren Bildwerkzeug neu. Gleiche wiederkehrende Tätigkeiten dürfen dasselbe neu erstellte Motiv verwenden, wenn es zum Thema passt. Ein neues Thema verlangt erneut eine passende Bildauswahl.
- Ein kräftig konturiertes Comic-Hauptmotiv, klare Farbfelder und eine lebendige, leicht überzeichnete Form; keine Beschriftung oder kleinteiligen Hintergründe. Auf etwa 60–90 Pixel noch erkennbar. Möglichst quadratisch mit echtem transparentem Hintergrund und Abstand zum Rand; keine dunklen Rechtecke oder grossflächigen Farbschleier um das Symbol. Speichere neue Einzelbilder als Dateien unter assets/ und referenziere sie mit imageFile. Für Standardicons bleibt image leer und icon enthält die passende Kennung.
- Symbole sind Orientierungshilfen. Stelle keine ungesicherten medizinischen Verfahren, anatomischen Details oder Handlungsschritte als fachliche Lehrgrafik dar. Wenn eine Lehrgrafik ausdrücklich benötigt wird, fachliche Richtigkeit anhand geeigneter Quellen prüfen. Keine identifizierbaren Patientinnen oder Patienten aus Unterrichtsfällen darstellen.

### Reisehintergrund pro Thema

- Erstelle einen eigenen, zum Themenblock passenden Reisehintergrund. Bei mehreren deutlich unterschiedlichen Themen an einem Tag verbinde wenige passende Motive zu einer ruhigen Bildwelt; kein Collage-Wimmelbild.
- Verankere das Thema im Hintergrund durch sichtbar erkennbare Gegenstände, Modelle oder Arbeitssituationen aus den Unterrichtsunterlagen. Ein bloss passend eingefärbter Raum genügt nicht. Wähle vor der Bildgenerierung wenige konkrete Leitmotive und benenne sie ausdrücklich im Bildprompt.
- Beispiele: Bei «Skelett» steht ein gut erkennbares anatomisches Skelettmodell im Unterrichts- oder Übungsraum, eventuell ergänzt durch ein Gelenkmodell. Bei «Notfälle» ist eine Schweizer Ambulanz oder Rettungsausrüstung zu sehen; bei «Hygiene» ein Waschplatz mit passenden Arbeitsmitteln. Pflege zeigt einen geeigneten Pflegebereich. Für abstrakte Themen wie Ressourcen eine aus dem Inhalt begründete, verständliche Metapher wählen. Die Beispiele passen sich den tatsächlichen Unterlagen an; nicht jedes Thema wird als Landschaft umgesetzt.
- Platziere die thematischen Hauptmotive so, dass sie auch mit eingeblendeten Auftragskarten deutlich sichtbar bleiben, etwa seitlich im Raum. Prüfe das fertige Bild und anschliessend den zusammengesetzten Screen: Ist das Thema ohne Titel erkennbar, ist das zentrale Motiv vorhanden und bleibt der Ablauf lesbar? Falls das Leitmotiv fehlt oder vollständig verdeckt wird, überarbeite das Bild beziehungsweise die Platzierung.
- Die Reise bleibt erkennbar: eine dezente Verbindung zwischen Lernstationen, ein Weg durch den gewählten Lernort oder eine andere sinnvolle räumliche Entwicklung. Ein Indoor-Hintergrund ist ebenso erwünscht wie ein Aussenraum. Die Verbindung ist eine visuelle Metapher, keine Darstellung eines medizinischen Behandlungsablaufs.
- Nutze CH-Referenzen aus den Unterlagen oder von passenden Schweizer Fachorganisationen und öffentlichen Stellen. Prüfe bei konkreten Fahrzeugen, Einrichtungen und Ausrüstung deren Erscheinungsbild anhand solcher Referenzen. Keine amerikanischen Ambulanz-, Polizei- oder Spitalbilder als Schweizer Kontext ausgeben. Beschriftungen, Notrufnummern und Fachsymbole nur verwenden, wenn sie benötigt und geprüft sind; keine erfundenen Organisationslogos. Dokumentiere die verwendeten Referenzlinks bei den Projektunterlagen und beim Bildprompt.
- Querformat etwa 16:9, etwa 1600 Pixel breit (für die Website in der Regel ausreichend). Komponiere eine lebendige Comic-Szene mit klaren Themenmotiven an beiden Seiten und im unteren Drittel; die zentralen rund 45–50 Prozent sowie die unmittelbaren Textbereiche bleiben hell und detailarm. Die freie Mitte darf zum Raum gehören und sanfte Licht- oder Farbflächen zeigen; keine grosse sterile beige Leere. Prüfe mit den tatsächlichen Kartenpositionen, dass Figuren, Skelettmodell oder andere Leitmotive sichtbar bleiben. Keine eingebauten Texte, Uhren, Pfeile, Karten oder Bedienflächen.
- Den Hintergrund unter einer eigenen Kennung in `assets.backgrounds` ablegen und im Plan über `backgroundId` zuordnen. Namen und verwendeten Bildprompt speichern. Bestehende Hintergründe anderer Pläne erhalten.

Wenn das verwendete LLM kein Bildwerkzeug hat, sage das offen. Bereite die Planung und genaue Bildprompts vor und biete die vorhandene Bibliothek nur als ausdrücklich gekennzeichnete Übergangslösung an. Behaupte keine neu erzeugten Bilder, die tatsächlich nicht erstellt wurden.


## Lokale Website: Einrichten und Daten austauschen

ClassJourney wird als Website in Chrome oder Edge verwendet. Pläne und Bilder bleiben im lokalen Ordner. Keine ClassJourney-Installation, kein lokaler Webserver, keine Python-Hilfsprogramme und keine Cloud-Synchronisierung sind nötig. Der bereits vorhandene lokale KI-Agent benötigt Dateiwerkzeuge; individuelle neue Bilder benötigen ein Bildwerkzeug.

### Beim erstmaligen Einrichten

Die Startanweisung enthält diesen vollständigen Skill, die Referenzen und eine eindeutige Vorbereitung. Lege einen neuen Ordner namens ClassJourney in einem für dich tatsächlich les- und beschreibbaren lokalen Arbeitsbereich an. Nicht im synchronisierten Cloud-Ordner, wenn ein rein lokaler Bereich verfügbar ist. Nutze keinen Datenordner einer installierten ClassJourney-App und überschreibe keine vorhandene Sammlung. Fordere gegebenenfalls die nötige Freigabe in deiner KI-Anwendung an. Prüfe den tatsächlichen Zugriff durch Schreiben und Lesen der angeforderten Dateien. Ein Prompt allein verleiht keine Dateiberechtigungen.

Erstelle die in der Startanweisung genannten Textdateien und BROWSER-Vorbereitung.json. Trage dort den tatsächlich aufgelösten absoluten Ordnerpfad und die unveränderten Einrichtungskennungen ein. Erfinde keine erfolgreiche Einrichtung ohne tatsächlichen Dateizugriff. Gib den vollständigen absoluten Ordnerpfad am Ende allein in einem kopierbaren Codeblock zurück. Erkläre kurz: Den Pfad in ClassJourney einfügen, «Ordner auswählen und freigeben» anklicken und im Browserdialog genau diesen Ordner auswählen. Das Einfügen des Pfads allein erteilt keine Freigabe.

Vor der Browserverbindung noch keine Pläne erstellen. Die Website legt beim Verbinden die aktuelle Sammlung und Bilddateien ab. Danach zuerst BROWSER-Verbindung.json und data/plans.json lesen. Falls diese Dateien noch fehlen, kurz auf die Browserverbindung hinweisen. Nicht selbst eine Ersatzsammlung erstellen.

### Bei jeder Planung

1. Lies BROWSER-Verbindung.json, diesen vollständigen Skill und die Referenzen. Prüfe den realen absoluten Ordnerpfad gegen agentRoot. Die Kennung libraryId in data/plans.json muss mit der Verbindungsdatei übereinstimmen. Bei einer Abweichung stoppen und den richtigen Ordner klären.
2. Lies data/plans.json. Sie enthält die vollständige Sammlung mit Bildverweisen: assets.backgrounds[*].srcFile, assets.atlasFile, assets.fageAtlasFile und optional activities[*].imageFile. Alle Pfade sind relativ zu diesem Ordner. Keine externen Bildadressen, keine absoluten Bildpfade, keine Verknüpfungen auf andere Orte und kein «..» verwenden.
3. Bearbeite nur beauftragte Pläne. Erhalte andere Pläne, Kennungen und bestehende Bildverweise. Die zwölf vorgefertigten Icons bleiben über icon verfügbar; image bleibt dabei leer. Neue Hintergründe etwa 1600 Pixel breit und als kompaktes WebP oder JPEG, neue Einzelicons nach Möglichkeit höchstens 384×384 Pixel und transparent. Bestehende 3×2-Atlanten nicht verändern.
4. Neue oder geänderte Bilder erhalten neue Dateinamen. Bereits veröffentlichte Bilddateien nicht überschreiben oder löschen: Sicherungen und andere Pläne können darauf verweisen.
5. Setze updatedAt der geänderten Pläne und modifiedAt der Sammlung auf aktuelle Unix-Millisekunden. workspaceAssets bleibt true. Prüfe Zeiten, Kennungen und alle Bildverweise.
6. Speichere zuerst sämtliche Bilddateien vollständig, dann data/plans.json. Schreibe die gleiche vollständige Plandatei nach output/Sammlung.classjourney.json: zuerst eine temporäre Datei im selben Ordner, dann atomar auf den endgültigen Namen umbenennen. Kein Python-Bauschritt und kein Einbetten grosser Bilddaten. Diese fertige Ausgabe ist das Freigabesignal für die Website.
7. Prüfe output/BROWSER-Status.json. Nur status «applied» und sourceModifiedAt gleich modifiedAt deiner Ausgabe bestätigen die Übernahme. Ist der Browser geschlossen, pausiert oder im Planeditor, bleibt die Ausgabe bereit. Dann melden: «Im Ordner bereit; ClassJourney öffnen beziehungsweise die Bearbeitung abschliessen.» Keinen manuellen Import verlangen.

Die Browserapp wartet bei offenen Planänderungen, bewahrt bei Konflikten beide Fassungen und schreibt vorher eine Sicherung. Fehlende Pläne in einer KI-Ausgabe löschen keine vorhandenen Tage. data/browser-collection.classjourney.json, data/browser-sync.json und backups/ gehören der Browserapp; nicht durch die KI bearbeiten. Die Bilddateien im Ordner gehören zu den Sicherungen und bleiben erhalten. Persönliche Pläne, Unterrichtsunterlagen und Bilder niemals auf GitHub hochladen.
