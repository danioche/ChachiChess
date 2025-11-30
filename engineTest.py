import chess
import chess.engine

engine = chess.engine.SimpleEngine.popen_uci("C:\\Users\\danie\\devel\\bin\\stockfish")

board = chess.Board()
info = engine.analyse(board, chess.engine.Limit(time=0.1))
print("Score:", info["score"])
# Score: PovScore(Cp(+20), WHITE)

board = chess.Board("r1bqkbnr/p1pp1ppp/1pn5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 2 4")
info = engine.analyse(board, chess.engine.Limit(depth=20))
print("Score:", info["score"])
# Score: PovScore(Mate(+1), WHITE)

nextMove = engine.play( board, chess.engine.Limit(depth=20))
print ("Move:", nextMove.move)

# Check 
# https://python-chess.readthedocs.io/en/v1.11.2/engine.html#playing


engine.quit()