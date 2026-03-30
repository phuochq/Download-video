const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");

const app = express();

// ✅ FIX CORS TRIỆT ĐỂ
app.use(cors({
  origin: "*",
  methods: ["GET"]
}));

// test API
app.get("/", (req, res) => {
  res.send("🚀 API Video Downloader PRO đang chạy");
});

app.get("/api/get-video", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

  try {
    const info = await ytdlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: "best"
    });

    // 🎯 lấy video ngon nhất
    let video =
      info.url ||
      (info.formats &&
        info.formats.find(f => f.ext === "mp4" && f.vcodec !== "none")?.url);

    if (!video) {
      return res.json({ error: "Không tìm thấy video" });
    }

    res.json({
      platform: info.extractor,
      title: info.title,
      thumbnail: info.thumbnail,
      video: video
    });

  } catch (err) {
    res.json({ error: "Không hỗ trợ link này" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running"));
