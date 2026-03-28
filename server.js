import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// test root
app.get("/", (req, res) => {
  res.send("🚀 API Download Video đang chạy");
});

// API chính
app.get("/api/get-video", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "Thiếu URL" });
  }

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

    // 🎯 BẮT RESPONSE XỊN (multi platform)
    page.on("response", async (response) => {
      try {
        const resUrl = response.url();
        const contentType = response.headers()["content-type"] || "";

        // chỉ lấy JSON/API
        if (!contentType.includes("application/json")) return;

        const text = await response.text();

        // 🔥 lọc cực mạnh
        if (
          text.includes("video") ||
          text.includes("play_addr") ||
          text.includes("download_addr") ||
          text.includes("url")
        ) {
          try {
            const json = JSON.parse(text);

            // TikTok / Douyin
            if (json?.item_list) {
              videoUrl =
                json.item_list[0]?.video?.play_addr?.url_list?.[0];
            }

            // generic format
            if (!videoUrl && json?.data) {
              const data = JSON.stringify(json.data);

              const match = data.match(/https:[^"]+\.mp4/g);
              if (match && match.length > 0) {
                videoUrl = match[0];
              }
            }

          } catch {}
        }
      } catch {}
    });

    // mở trang
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    // ⏳ chờ JS load + API gọi xong
    await new Promise((r) => setTimeout(r, 15000));

    await browser.close();

    if (videoUrl) {
      return res.json({ video: videoUrl });
    } else {
      return res.json({
        error: "Không tìm thấy video",
        tip: "Link có thể không hỗ trợ hoặc bị chặn"
      });
    }

  } catch (err) {
    if (browser) await browser.close();
    return res.json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server chạy tại port " + PORT);
});
