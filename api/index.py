from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
# Cho phép cả có www và không có www
allowed_origins = ["https://www.openvnn.com", "https://openvnn.com"]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

@app.route('/api', methods=['GET', 'POST', 'OPTIONS'])
def download():
    # 1. Xử lý Preflight Request (OPTIONS) thủ công
    if request.method == 'OPTIONS':
        origin = request.headers.get('Origin')
        response = make_response()
        if origin in allowed_origins:
            response.headers.add("Access-Control-Allow-Origin", origin)
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,OPTIONS")
        return response

    # 2. Lấy dữ liệu Video
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
            
            # 3. Tạo Response thành công và chèn Header CORS thủ công
            result = {
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "video_url": info.get('url')
            }
            res = make_response(jsonify(result))
            origin = request.headers.get('Origin')
            if origin in allowed_origins:
                res.headers.add("Access-Control-Allow-Origin", origin)
            return res

    except Exception as e:
        error_res = make_response(jsonify({"error": str(e)}), 500)
        origin = request.headers.get('Origin')
        if origin in allowed_origins:
            error_res.headers.add("Access-Control-Allow-Origin", origin)
        return error_res
