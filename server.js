import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function isYouTubeUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    return ["youtube.com", "m.youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host);
  } catch {
    return false;
  }
}

function extractText(result) {
  if (typeof result.output_text === "string") return result.output_text;
  const parts = [];
  for (const step of (result.steps || [])) {
    for (const content of (step.content || [])) {
      if (content.text) parts.push(content.text);
    }
  }
  return parts.join("\n");
}

function parseModelJson(raw) {
  const cleaned = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Die KI hat kein lesbares JSON zurückgegeben.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

app.get("/api/status", (_req, res) => {
  res.json({ configured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/analyze", async (req, res) => {
  const { url } = req.body || {};
  if (typeof url !== "string" || !isYouTubeUrl(url)) {
    return res.status(400).json({ error: "Bitte gib einen gültigen YouTube-Link ein." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: "Die KI-Analyse ist noch nicht eingerichtet. Trage deinen Gemini API-Schlüssel in die .env-Datei ein und starte CraftList neu."
    });
  }

  try {
    const prompt = `Du bist ein sorgfältiger Minecraft-Bauassistent. Analysiere das öffentliche YouTube-Video als Minecraft-Bau-Tutorial.
Erstelle eine möglichst vollständige Materialliste für das fertige Bauwerk. Zähle nur Materialien, die tatsächlich für den Bau benötigt werden, nicht Werkzeuge, Nahrung oder zufällige Inventargegenstände.
Nutze sichtbare Bauabschnitte, gesprochene Mengenangaben und wiederholte Muster. Wenn eine exakte Anzahl aus dem Video nicht zuverlässig erkennbar ist, gib eine bestmögliche Schätzung ab und kennzeichne sie als geschätzt. Erfinde keine exakten Mengen. Fasse identische Minecraft-Blöcke zusammen. Verwende deutsche Minecraft-Namen, soweit möglich.
Antworte AUSSCHLIESSLICH als valides JSON in dieser Struktur:
{
  "title": "Kurzer Projekttitel",
  "summary": "Kurze Beschreibung des Bauwerks",
  "materials": [
    {
      "name": "Steinziegel",
      "quantity": 128,
      "unit": "Blöcke",
      "category": "Baublöcke",
      "confidence": "hoch|mittel|niedrig",
      "note": "Optionaler Hinweis oder leerer String"
    }
  ],
  "warnings": ["Hinweis zu Unsicherheiten, fehlenden Abschnitten oder Schätzungen"]
}
quantity muss eine positive ganze Zahl sein. Nutze sinnvolle Kategorien wie Baublöcke, Holz, Glas, Dekoration, Redstone, Sonstiges. Keine Markdown-Codeblöcke. Wenn das Video kein Minecraft-Baututorial ist, gib eine leere materials-Liste und erkläre es in warnings.`;

    const apiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": process.env.GEMINI_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash",
        input: [
          { type: "video", uri: url, processing: "agentic" },
          { type: "text", text: prompt }
        ]
      })
    });
    const interaction = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("Gemini API error:", interaction);
      throw new Error("Gemini API request failed. Prüfe API-Schlüssel, Modellzugriff und Kontingent.");
    }

    const raw = extractText(interaction);
    const data = parseModelJson(raw);
    const materials = Array.isArray(data.materials) ? data.materials : [];
    const normalized = materials
      .filter(m => m && typeof m.name === "string" && Number.isFinite(Number(m.quantity)) && Number(m.quantity) > 0)
      .map(m => ({
        name: m.name.trim().slice(0, 90),
        quantity: Math.max(1, Math.round(Number(m.quantity))),
        unit: typeof m.unit === "string" ? m.unit.slice(0, 24) : "Blöcke",
        category: typeof m.category === "string" ? m.category.slice(0, 40) : "Sonstiges",
        confidence: ["hoch", "mittel", "niedrig"].includes(m.confidence) ? m.confidence : "mittel",
        note: typeof m.note === "string" ? m.note.slice(0, 180) : ""
      }));

    res.json({
      title: typeof data.title === "string" ? data.title.slice(0, 100) : "Minecraft-Bauprojekt",
      summary: typeof data.summary === "string" ? data.summary.slice(0, 400) : "",
      materials: normalized,
      warnings: Array.isArray(data.warnings) ? data.warnings.filter(x => typeof x === "string").slice(0, 8) : []
    });
  } catch (error) {
    console.error("Analysis failed:", error);
    res.status(500).json({
      error: error?.message?.includes("JSON")
        ? "Die KI-Antwort konnte nicht verarbeitet werden. Versuche es bitte erneut."
        : "Die Videoanalyse ist fehlgeschlagen. Prüfe, ob das Video öffentlich erreichbar ist, und versuche es erneut."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CraftList läuft auf http://localhost:${PORT}`);
});
