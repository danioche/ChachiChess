from flask import Flask, send_from_directory, request, jsonify

# Chess Engine load 
import chess
import chess.engine

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

@app.route('/move', methods = ['POST','GET'])
def move():
    fenPos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    engine = chess.engine.SimpleEngine.popen_uci("C:\\Users\\danie\\devel\\bin\\stockfish")
    
    if request.method == 'GET':
        fenPos = request.args.get('fen')

    board = chess.Board(fenPos)

    nextMove = engine.play( board, chess.engine.Limit(depth=20))

    return str(nextMove.move)


if __name__ == '__main__':
    app.run(debug=True)