const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/get-video", async (req, res) => {
    try {
        const { url } = req.body;

        const html = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://jimeng.jianying.com/",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        const match = html.data.match(/"download_info":\{"url":"(.*?)"/);

        if (!match) {
            return res.json({ error: "Không tìm thấy video" });
        }

        let video = match[1];

        video = video
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/");

        res.json({ video });

    } catch (err) {
        console.log(err.message);
        res.json({ error: "Lỗi server" });
    }
});

app.listen(3000, () => console.log("Running"));
