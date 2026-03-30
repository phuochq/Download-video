const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 API Downloader PRO (No Puppeteer)");
});

// 🎯 detect nền tảng
function detectPlatform(url) {
  if (url.includes("tiktok")) return "tiktok";
  if (url.includes("facebook")) return "facebook";
  if (url.includes("instagram")) return "instagram";
  if (url.includes("youtube")) return "youtube";
  return "unknown";
}

app.post("/api/get-video", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

  try {
    const platform = detectPlatform(url);

    const result = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
      format: "best"
    });

    let videoUrl = null;

    // 🎯 ưu tiên format mp4
    if (result?.formats) {
      const mp4 = result.formats
        .filter(f => f.ext === "mp4" && f.url)
        .sort((a, b) => (b.height || 0) - (a.height || 0));

      if (mp4.length > 0) {
        videoUrl = mp4[0].url;
      }
    }

    // fallback
    if (!videoUrl && result.url) {
      videoUrl = result.url;
    }

    if (!videoUrl) {
      return res.json({ error: "Không tìm thấy video" });
    }

    return res.json({
      platform,
      video: videoUrl,
      title: result.title || "",
      thumbnail: result.thumbnail || ""
    });

  } catch (err) {
    return res.json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Server PRO running");
});
