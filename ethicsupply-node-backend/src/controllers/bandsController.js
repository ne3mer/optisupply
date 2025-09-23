const fs = require("fs");
const path = require("path");

exports.getBands = async (req, res) => {
  try {
    const bandsPath = path.join(__dirname, "../../data/bands_v1.json");
    if (!fs.existsSync(bandsPath)) {
      return res.status(404).json({ error: "bands_v1.json not found" });
    }
    const raw = fs.readFileSync(bandsPath, "utf-8");
    const json = JSON.parse(raw);
    return res.status(200).json(json);
  } catch (e) {
    console.error("Error reading bands_v1.json:", e);
    return res.status(500).json({ error: "Failed to load bands" });
  }
};

