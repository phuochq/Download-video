const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/get-video", async (req, res) => {
    try {
        const { url } = req.body;

        const videoId = url.match(/\/s\/(.*?)\//)?.[1];

        if (!videoId) {
            return res.json({ error: "Sai link" });
        }

        const apiUrl = `https://jimeng.jianying.com/api/share/info?video_id=${videoId}`;

        const response = await axios.get(apiUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://jimeng.jianying.com/"
            }
        });

        const video =
            response.data?.data?.page_info?.creation?.metadata?.download_info?.url;

        res.json({ video });

    } catch (err) {
        res.json({ error: "Lỗi server" });
    }
});

app.listen(3000, () => console.log("Running"));
