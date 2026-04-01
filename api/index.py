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

    # Cấu hình tối ưu cho đa nền tảng
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        # Ưu tiên lấy video chất lượng tốt nhất có sẵn (thường không logo với TikTok/Douyin)
        'format': 'bestvideo+bestaudio/best', 
        'check_formats': True
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=False)
            
            # Xử lý lấy danh sách định dạng linh hoạt
            formats = []
            
            # TikTok/Douyin thường trả về 1 link trực tiếp tốt nhất (No Watermark)
            if 'tiktok' in video_url or 'douyin' in video_url:
                formats.append({
                    "quality": "HD No Watermark",
                    "ext": "mp4",
                    "url": info.get('url')
                })
            else:
                # Các nền tảng khác: Lấy danh sách định dạng như cũ
                for f in info.get('formats', []):
                    if f.get('url') and f.get('vcodec') != 'none' and f.get('acodec') != 'none':
                        # Lọc bỏ các link quá thấp hoặc không cần thiết
                        note = f.get('format_note') or f.get('resolution') or "Standard"
                        formats.append({
                            "quality": note,
                            "ext": f.get('ext', 'mp4'),
                            "url": f.get('url')
                        })

            # Lấy Audio cho mọi nền tảng
            audio = None
            for f in info.get('formats', []):
                if f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                    audio = f.get('url')
                    break

            data = {
                "title": info.get('title', 'Video Content'),
                "thumbnail": info.get('thumbnail'),
                "formats": formats[:6], # Giới hạn 6 tùy chọn để tránh rối
                "audio": audio,
                "platform": info.get('extractor_key') # Trả về tên nền tảng (TikTok, Facebook...)
            }
            return _corsify_actual_response(jsonify(data))
    except Exception as e:
        return _corsify_actual_response(jsonify({"error": str(e)}), 500)

# Các hàm bổ trợ _build_cors_preflight_response và _corsify_actual_response giữ nguyên như cũ

def _build_cors_preflight_response():
    res = make_response()
    res.headers.add("Access-Control-Allow-Origin", "https://www.openvnn.com")
    res.headers.add("Access-Control-Allow-Headers", "*")
    res.headers.add("Access-Control-Allow-Methods", "GET, OPTIONS")
    return res, 204

def _corsify_actual_response(response, status=200):
    response.headers.add("Access-Control-Allow-Origin", "https://www.openvnn.com")
    return response, status
