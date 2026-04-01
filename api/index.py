from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
allowed_origins = ["https://www.openvnn.com", "https://openvnn.com"]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

@app.route('/api', methods=['GET', 'OPTIONS'])
def handler():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()

    video_url = request.args.get('url')
    if not video_url:
        return _corsify_actual_response(jsonify({"error": "No URL"}), 400)

    # Cấu hình lấy đầy đủ thông tin định dạng
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'format': 'best' 
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            # Lọc các định dạng video có cả hình và tiếng (hoặc mp4)
            formats = []
            for f in info.get('formats', []):
                # Chỉ lấy các định dạng có link trực tiếp và là video+audio (ext là mp4)
                if f.get('url') and f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                    formats.append({
                        "quality": f.get('format_note') or f.get('resolution') or "Chất lượng thường",
                        "ext": f.get('ext'),
                        "url": f.get('url')
                    })

            # Lấy thêm 1 bản Audio MP3 nếu có
            audio = next((f['url'] for f in info['formats'] if f.get('acodec') != 'none' and f.get('vcodec') == 'none'), None)

            data = {
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "formats": formats[:5], # Lấy 5 định dạng tốt nhất để tránh rối
                "audio": audio
            }
            return _corsify_actual_response(jsonify(data))
    except Exception as e:
        return _corsify_actual_response(jsonify({"error": str(e)}), 500)

def _build_cors_preflight_response():
    res = make_response()
    res.headers.add("Access-Control-Allow-Origin", "https://www.openvnn.com")
    res.headers.add("Access-Control-Allow-Headers", "*")
    res.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
    return res, 204

def _corsify_actual_response(response, status=200):
    response.headers.add("Access-Control-Allow-Origin", "https://www.openvnn.com")
    return response, status
