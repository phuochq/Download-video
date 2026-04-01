from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app) # Cho phép Blogspot truy cập vào API này

@app.route('/api', methods=['GET'])
def download():
    video_url = request.args.get('url')
    if not video_url:
        return jsonify({"error": "No URL provided"}), 400

    ydl_opts = {
    'format': 'best[ext=mp4]/best', # Ưu tiên lấy file mp4 đã có sẵn cả hình và tiếng
    'quiet': True,
    'noplaylist': True,
    'extract_flat': False,
    # Thêm dòng này để bỏ qua các lỗi không quá nghiêm trọng
    'ignoreerrors': True, 
    # Ép buộc yt-dlp không cố gắng giải mã các chữ ký quá phức tạp nếu không có JS runtime
    'youtube_include_dash_manifest': False, 
}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(video_url, download=False)
            return jsonify({
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "video_url": info.get('url'), # Link tải trực tiếp
                "formats": [{"quality": f.get('format_note'), "url": f.get('url')} for f in info.get('formats') if f.get('vcodec') != 'none']
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run()
