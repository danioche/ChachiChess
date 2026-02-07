from flask import Flask, send_from_directory, request, jsonify

# Chess Engine load 
import chess
import chess.engine

g_skill = 1

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

    # TODO: This should be a param or an environment variable (second option best)
    engine = chess.engine.SimpleEngine.popen_uci("C:\\Users\\danie\\devel\\bin\\stockfish")
    
    if request.method == 'GET':
        fenPos = request.args.get('fen')

    board = chess.Board(fenPos)

    nextMove = engine.play( board, chess.engine.Limit(depth=20), options={'Skill Level': g_skill})

    return str(nextMove.move)

@app.route('/skill', methods = ['GET'] )
def setSkill():
    set_skill = 1
    
    if request.method == 'GET':
        set_skill = request.args.get('elo')

    if set_skill < 400:
        g_skill = 1  # Beginner
    elif set_skill < 800:
        g_skill = 2  # Novice
    elif set_skill < 1200:
        g_skill = 3  # Intermediate
    elif set_skill < 1600:
        g_skill = 4  # Advanced
    else:
        g_skill = 5  # Expert


if __name__ == '__main__':
    app.run(debug=True)