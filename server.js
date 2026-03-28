import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("🚀 API Playwright OK");
});

app.get("/api/get-video", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "Thiếu URL" });

  let browser;

  try {
    browser = await chromium.launch({
      headless: true
    });

    const page = await browser.newPage();

    let videoUrl = null;

    // 🎯 bắt response
    page.on("response", async (response) => {
      try {
        const text = await response.text();

        if (text.includes(".mp4")) {
          const match = text.match(/https:[^"]+\.mp4/g);
          if (match) {
            videoUrl = match[0];
          }
        }
      } catch {}
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    await page.waitForTimeout(12000);

    await browser.close();

    if (videoUrl) {
      return res.json({ video: videoUrl });
    } else {
      return res.json({ error: "Không tìm thấy video" });
    }

  } catch (err) {
    if (browser) await browser.close();
    return res.json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server Playwright running");
});
