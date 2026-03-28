const express = require("express");
const cors = require("cors");

const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   ROOT CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ Jimeng Video Parser API is running");
});

/* =========================
   PARSE VIDEO LINK
========================= */
app.post("/api/get-video", async (req, res) => {
  const url = req.body?.url;
  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

  let browser;
  let videoUrl = null;

  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    /* === GIẢ LẬP TRÌNH DUYỆT NGƯỜI DÙNG === */
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 768 });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined
      });
    });

    /* === CHẶN RESOURCE KHÔNG CẦN === */
    await page.setRequestInterception(true);
    page.on("request", r => {
      const type = r.resourceType();
      if (["image", "stylesheet", "font"].includes(type)) r.abort();
      else r.continue();
    });

    /* === BẮT API TRẢ VIDEO URL === */
    page.on("response", async response => {
      try {
        if (videoUrl) return;

        const resUrl = response.url();
        if (!resUrl.includes("jimeng") && !resUrl.includes("jianying")) return;

        const text = await response.text();
        if (!text || !text.includes("download_info")) return;

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
      } catch {}
    });

    /* === LOAD TRANG === */
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 25000
    });

    /* === ĐỢI TỐI ĐA 20s === */
    const start = Date.now();
    while (!videoUrl && Date.now() - start < 20000) {
      await new Promise(r => setTimeout(r, 1000));
    }

    await browser.close();

    if (videoUrl) {
      return res.json({
        video: videoUrl
      });
    }

    return res.json({
      error: "Không lấy được link MP4 (bị block hoặc API không xuất hiện)"
    });

  } catch (err) {
    if (browser) await browser.close();
    res.json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
