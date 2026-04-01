from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)

# Cấu hình CORS chặt chẽ cho miền của bạn
CORS(app, resources={r"/api/*": {"origins": ["https://www.openvnn.com", "https://openvnn.com"]}})

@app.route('/api', methods=['GET', 'OPTIONS'])
def download():
    # Xử lý Preflight request (OPTIONS)
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "https://www.openvnn.com")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response

    video_url = request.args.get('url')
    if not video_url:
        return jsonify({"error": "No URL provided"}), 400

    ydl_opts = {
        'format': 'best',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            return jsonify({
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "video_url": info.get('url')
            })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
