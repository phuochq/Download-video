const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 API Downloader PRO đang chạy");
});

app.post("/api/get-video", async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    let videoUrl = null;

    // 🚀 chặn tài nguyên nặng
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 🎯 bắt API response
    page.on("response", async (response) => {
      try {
        const resUrl = response.url();

        if (
          resUrl.includes("tiktok") ||
          resUrl.includes("facebook") ||
          resUrl.includes("instagram") ||
          resUrl.includes("douyin")
        ) {
          const text = await response.text();

          if (text.includes(".mp4")) {
            const match = text.match(/https?:\/\/[^"]+\.mp4[^"]*/);

            if (match) {
              videoUrl = match[0];
            }
          }
        }
      } catch (e) {}
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0
    });

    await new Promise(r => setTimeout(r, 8000));

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

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
