from flask import Flask, send_from_directory, request, jsonify

# Chess Engine load 
import chess
import chess.engine

# Lesson parser
from classroom.lesson_parser import Lesson


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

@app.route('/lesson', methods = ['POST','GET'] )
def lesson():
    teacher = "daniTeacher"
    lesson_file = "begginer.chl"
    lesson = ""

    import os

    # Lets get the current PGN
    if request.method == 'GET':
        pgn = request.args.get('pgn')
    
    print( "I got this pgn: ", pgn )

    test_path = os.path.join(os.path.dirname(__file__), 'classroom', teacher, 'lessons', lesson_file )
    if os.path.exists(test_path):
        lesson = Lesson.from_file(test_path)
        import json
        print(json.dumps(lesson.to_dict(), indent=2, ensure_ascii=False))
    else:
        print('Test file not found:', test_path)

    return lesson.to_dict()

@app.route('/move', methods = ['POST','GET'])
def move():
    fenPos = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

    # TODO: This should be a param or an environment variable (second option best)
    engine = chess.engine.SimpleEngine.popen_uci("C:\\Users\\danie\\devel\\bin\\stockfish")
    
    if request.method == 'GET':
        fenPos = request.args.get('fen')

    board = chess.Board(fenPos)

    nextMove = engine.play( board, chess.engine.Limit(depth=20), options={'Skill Level': 1})

    return str(nextMove.move)

@app.route('/skill', methods = ['GET'] )
def setSkill():
    set_skill = 1
    g_skill = 1
    
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