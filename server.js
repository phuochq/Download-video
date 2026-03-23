const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api/get-video", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    let videoUrl = null;

    // 🚀 chặn request nặng (tăng tốc)
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // 🎯 bắt response API
    page.on("response", async (response) => {
      try {
        const resUrl = response.url();

        if (resUrl.includes("creation") || resUrl.includes("video")) {
          const text = await response.text();

          if (text.includes("video_url") || text.includes("download_info")) {
            const json = JSON.parse(text);

            const data = json?.data?.page_info?.creation?.metadata;

            if (data?.download_info?.url) {
              videoUrl = data.download_info.url;
            }
          }
        }
      } catch (e) {}
    });

    // 🔥 mở link
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0
    });

    // ⏳ chờ JS load
    await new Promise(r => setTimeout(r, 5000));

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
  console.log("Server running at http://localhost:3000");
});
