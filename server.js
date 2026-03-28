import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("🚀 API OK");
});

app.get("/api/get-video", async (req, res) => {
  const url = req.query.url;

  if (!url) return res.json({ error: "Thiếu URL" });

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    let videoUrl = null;

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (["image", "stylesheet", "font"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    page.on("response", async (response) => {
      try {
        const text = await response.text();

        if (text.includes(".mp4")) {
          const match = text.match(/https:[^"]+\.mp4/g);
          if (match) videoUrl = match[0];
        }
      } catch {}
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    await new Promise((r) => setTimeout(r, 12000));

    await browser.close();

    if (videoUrl) {
      res.json({ video: videoUrl });
    } else {
      res.json({ error: "Không tìm thấy video" });
    }

  } catch (err) {
    if (browser) await browser.close();
    res.json({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000);
