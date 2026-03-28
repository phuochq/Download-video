const express = require("express");
const cors = require("cors");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const app = express();
app.use(cors());
app.use(express.json());

// test server
app.get("/", (req, res) => {
  res.send("API RUNNING OK");
});

app.post("/api/get-video", async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
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
    const resUrl = response.url();
    const headers = response.headers();

    // ✅ bắt video qua content-type
    if (headers["content-type"]?.includes("video")) {
      videoUrl = resUrl;
    }

    // ✅ bắt mp4 trực tiếp
    if (resUrl.includes(".mp4")) {
      videoUrl = resUrl;
    }

    // ✅ bắt m3u8 (rất quan trọng)
    if (resUrl.includes(".m3u8")) {
      videoUrl = resUrl;
    }

    // ✅ bắt JSON chứa video
    if (headers["content-type"]?.includes("json")) {
      const text = await response.text();

      // tìm link mp4 trong JSON
      const match = text.match(/https?:\/\/[^"]+\.mp4/g);
      if (match) {
        videoUrl = match[0];
      }

      // tìm m3u8
      const m3u8 = text.match(/https?:\/\/[^"]+\.m3u8/g);
      if (m3u8) {
        videoUrl = m3u8[0];
      }
    }

  } catch (e) {}
});
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0,
    });

    await new Promise((r) => setTimeout(r, 15000));

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
  console.log("Server running");
});
