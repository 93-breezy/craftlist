# CraftList – Minecraft Build Planner

CraftList ist eine Web-App, mit der du Minecraft-Bauprojekte aus YouTube-Tutorials organisieren und eine Materialliste verwalten kannst.

## Funktionen

- YouTube-Link einfügen und Video-Vorschau öffnen
- KI-Videoanalyse über die Gemini API
- Materialliste mit benötigter und bereits gesammelter Menge
- Mengen mit +/- ändern und Materialien abhaken
- Materialien hinzufügen, bearbeiten und löschen
- Fortschrittsanzeige, Suche und Filter
- CSV-Export

## Online veröffentlichen (Render)

Die App ist für Render vorbereitet. Du brauchst dafür ein GitHub-Konto und ein Render-Konto. Render bietet einen kostenlosen Web-Service-Tarif mit Einschränkungen.

1. Entpacke diese ZIP-Datei.
2. Öffne GitHub und melde dich an.
3. Erstelle ein neues Repository mit dem Namen `craftlist`.
4. Lade den **Inhalt** dieses Ordners in das Repository hoch. Lade `.env` niemals hoch. Die Datei `.gitignore` verhindert normalerweise, dass sie versehentlich mit Git übertragen wird.
5. Öffne Render und wähle **New → Web Service**.
6. Verbinde dein GitHub-Konto und wähle das Repository `craftlist`.
7. Trage diese Einstellungen ein:
   - Name: `craftlist` (oder ein anderer freier Name)
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`

   Die Datei `render.yaml` ist zusätzlich für eine spätere Bereitstellung als Render Blueprint enthalten.
8. Füge unter **Environment** die Variable `GEMINI_API_KEY` hinzu und trage dort deinen Gemini API-Schlüssel ein. Den Schlüssel nicht in GitHub-Dateien, Nachrichten oder den Browser-Code schreiben.
9. Klicke auf **Create Web Service** und warte, bis der Deploy abgeschlossen ist.
10. Öffne die von Render angezeigte `onrender.com`-Adresse.

Offizielle Anleitungen:
- Render: https://render.com/docs/deploy-node-express-app
- Render kostenloser Tarif: https://render.com/docs/free

## Wichtige Hinweise

- Kostenlose Render-Webdienste werden nach 15 Minuten ohne Zugriff pausiert. Der erste Aufruf danach kann ungefähr eine Minute dauern.
- Die App speichert Projekte und Materiallisten derzeit im lokalen Speicher des jeweiligen Browsers. Sie werden dadurch nicht automatisch zwischen Geräten synchronisiert. Browserdaten nicht löschen, wenn du deine Listen behalten möchtest; wichtige Listen zusätzlich als CSV exportieren.
- Die automatische Videoanalyse benötigt einen Gemini API-Schlüssel. Sie kann je nach Verfügbarkeit des verwendeten Gemini-Modells und API-Zugriff Änderungen benötigen.
- KI-Mengen sind Schätzungen und sollten vor dem Bau geprüft werden.
- Wenn du einen API-Schlüssel in eine öffentliche Datei hochgeladen hast, widerrufe ihn und erstelle einen neuen.

## Lokaler Start (optional)

Node.js 20 oder neuer installieren, im Projektordner `npm install` und anschließend `npm start` ausführen.
