from flask import Flask, send_from_directory, request, jsonify

app = Flask(__name__, static_folder='.')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory('.', 'favicon.ico')

@app.route('/')
def serve_index():
    return send_from_directory('.', 'chachi.html')

@app.route('/static/<path:filename>')
def serve_image(filename):
    return send_from_directory('static', filename)



if __name__ == '__main__':
    app.run(debug=True)