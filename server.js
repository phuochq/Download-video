import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";
import { execSync } from "child_process";
import fs from "fs";

const app = express();
app.use(cors());

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

app.get("/", (req, res) => {
  res.send("🚀 API OK");
});

app.get("/api/get-video", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json({ error: "Thiếu URL" });

  let browser;

  try {
    // 🔥 đảm bảo có Chrome trước khi chạy
    installChromeIfNeeded();

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

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});
