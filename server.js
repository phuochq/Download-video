const express = require("express");
const cors = require("cors");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API RUNNING OK");
});

app.post("/api/get-video", async (req, res) => {
  const url = req.body.url;

  if (!url) return res.json({ error: "Thiếu URL" });

  let browser;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    let videoUrl = null;

    page.on("response", async (response) => {
      try {
        const resUrl = response.url();

        if (resUrl.includes(".mp4")) {
          videoUrl = resUrl;
        }
      } catch (e) {}
    });

    await page.goto(url, { waitUntil: "networkidle2" });

    await new Promise(r => setTimeout(r, 10000));

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

app.listen(3000, () => console.log("Server running"));
