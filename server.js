const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Puppeteer đang chạy OK");
});

app.post("/api/get-video", async (req, res) => {
  const url = req.body.url;

  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      rgs: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
