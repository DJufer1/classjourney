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
