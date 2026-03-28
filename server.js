const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors({
  origin: ["https://openvnn.com"]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Puppeteer đang chạy OK");
});

app.post("/api/get-video", async (req, res) => {
  const url = req.body.url;
  if (!url) return res.json({ error: "Thiếu URL" });

  let browser;
  let videoUrl = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", req => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    page.on("response", async response => {
      try {
        const resUrl = response.url();
        if (resUrl.includes("jimeng") || resUrl.includes("jianying")) {
          const text = await response.text();
          if (text.includes("download_info")) {
            const json = JSON.parse(text);
            const creation = json?.data?.page_info?.creation;
            const list = json?.data?.page_info?.creation_list;

            if (creation?.metadata?.download_info?.url) {
              videoUrl = creation.metadata.download_info.url;
            }

            if (!videoUrl && Array.isArray(list)) {
              for (const item of list) {
                if (item?.metadata?.download_info?.url) {
                  videoUrl = item.metadata.download_info.url;
                  break;
                }
              }
            }
          }
        }
      } catch {}
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    for (let i = 0; i < 10 && !videoUrl; i++) {
      await new Promise(r => setTimeout(r, 1000));
    }

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

app.get("/api/download", async (req, res) => {
  const videoUrl = req.query.url;
  try {
    const response = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream",
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    res.setHeader("Content-Disposition", "attachment; filename=video.mp4");
    response.data.pipe(res);

  } catch {
    res.status(500).send("Download lỗi");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
