const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Extract ID từ link
 */
function extractId(url) {
    const match = url.match(/\/s\/(.*?)\//);
    return match ? match[1] : null;
}

app.post("/api/get-video", async (req, res) => {
    try {
        const { url } = req.body;

        const id = extractId(url);

        if (!id) {
            return res.json({ error: "Sai link" });
        }

        // 🔥 Gọi API nội bộ (QUAN TRỌNG)
        const apiUrl = `https://jimeng.jianying.com/web/v1/creation/detail/?item_id=${id}`;

        const response = await axios.get(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://jimeng.jianying.com/",
                "Accept": "application/json, text/plain, */*"
            }
        });

        const data = response.data;

        // 🔥 Parse đúng chỗ
        const video =
            data?.data?.creation?.metadata?.download_info?.url;

        if (!video) {
            return res.json({ error: "Không tìm thấy video" });
        }

        res.json({ video });

    } catch (err) {
        console.log(err.message);
        res.json({ error: "Lỗi server" });
    }
});

app.listen(3000, () => console.log("Server running"));
