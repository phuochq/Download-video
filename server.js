const express = require("express");
const cors = require("cors");
const ytdlp = require("yt-dlp-exec");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET"]
}));

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
      format: "bv*+ba/b",
      userAgent: "Mozilla/5.0"
    });

    const formats = info.formats || [];

    const mp4Formats = formats.filter(f =>
      f.ext === "mp4" &&
      f.vcodec !== "none" &&
      f.url
    );

    mp4Formats.sort((a, b) => (b.height || 0) - (a.height || 0));

    const best = mp4Formats[0];

    if (!best) {
      return res.json({ error: "Không tìm thấy video mp4" });
    }

    res.json({
      platform: info.extractor,
      title: info.title,
      thumbnail: info.thumbnail,
      video: best.url
    });

  } catch (err) {
    console.error(err);
    res.json({ error: "Không hỗ trợ link này hoặc bị chặn" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running"));
