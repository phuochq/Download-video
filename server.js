const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
// 🔥 AUTO INSTALL CHROME
const CHROME_PATH = "/opt/render/.cache/puppeteer/chrome";

function installChromeIfNeeded() {
  try {
    if (!fs.existsSync(CHROME_PATH)) {
      console.log("🚀 Installing Chrome...");
      execSync(
        "PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer npx puppeteer browsers install chrome",
        { stdio: "inherit" }
      );
      console.log("✅ Chrome installed");
    } else {
      console.log("✅ Chrome already exists");
    }
  } catch (err) {
    console.error("❌ Install Chrome failed:", err);
  }
}

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

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    page.on("response", async (response) => {
      try {
        const resUrl = response.url();

        if (resUrl.includes(".mp4")) {
          const text = await response.text();
          const match = text.match(/https?:\/\/[^"]+\.mp4[^"]*/);

          if (match) {
            videoUrl = match[0];
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
  console.log("🚀 Server running");
});
