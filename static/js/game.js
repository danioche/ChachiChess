// General Variables 
const actualThemePath = './static/themes/default/pieces/';
const pieceImages = [
    // White pieces
    { name: 'wK', src: actualThemePath+'wK.png' },
    { name: 'wQ', src: actualThemePath+'wQ.png' },
    { name: 'wR', src: actualThemePath+'wR.png' },
    { name: 'wB', src: actualThemePath+'wB.png' },
    { name: 'wN', src: actualThemePath+'wN.png' },
    { name: 'wP', src: actualThemePath+'wP.png' },
    // Black pieces
    { name: 'bK', src: actualThemePath+'bK.png' },
    { name: 'bQ', src: actualThemePath+'bQ.png' },
    { name: 'bR', src: actualThemePath+'bR.png' },
    { name: 'bB', src: actualThemePath+'bB.png' },
    { name: 'bN', src: actualThemePath+'bN.png' },
    { name: 'bP', src: actualThemePath+'bP.png' }
];
const moveLog = [];
// Map FEN piece letter to pieceImages name
const fenToPieceName = {
    'K': 'wK', 'Q': 'wQ', 'R': 'wR', 'B': 'wB', 'N': 'wN', 'P': 'wP',
    'k': 'bK', 'q': 'bQ', 'r': 'bR', 'b': 'bB', 'n': 'bN', 'p': 'bP'
};

// Initial position in FEN
const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
let boardArray = fenToBoardArray(initialFEN);
let draggedFrom = null;
let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
let castlingString = 'KQkq';
let enPassantTarget = '-';
let halfmoveClock = 0;
let fullmoveNumber = 1;
let isBoardFlipped = false;

// Board logic =================================================================

// 1) - CORE functions
// -----------------------------------------------------------------------------    
function fenToBoardArray(fen) {
    // Only use the first field (piece placement)
    const rows = fen.split(' ')[0].split('/');
    const board = [];
    for (let r = 0; r < 8; r++) {
        const row = [];
        let fenRow = rows[r];
        let c = 0;
        for (let i = 0; i < fenRow.length; i++) {
            const ch = fenRow[i];
            if (ch >= '1' && ch <= '8') {
                // Empty squares
                for (let j = 0; j < parseInt(ch); j++) {
                    row.push(null);
                    c++;
                }
            } else {
                // Piece
                const pieceName = fenToPieceName[ch];
                if (pieceName) {
                    const pieceObj = pieceImages.find(p => p.name === pieceName);
                    row.push(pieceObj || null);
                } else {
                    row.push(null);
                }
                c++;
            }
        }
        // Defensive: pad row if needed
        while (row.length < 8) row.push(null);
        board.push(row);
    }
    return board;
}

let allowedMovesPendingToConfirm = [];

// CORE: Main function to render the chess board 
// TODO: Refactor this in initialization funtion and movement / rendering function 
function renderChessBoard(squareSize = 64, boardArrayParam = null) {
    // Set CSS variables for square and label size
    document.documentElement.style.setProperty('--square-size', squareSize + 'px');
    document.documentElement.style.setProperty('--label-size', Math.round(squareSize * 0.4) + 'px');
    const container = document.getElementById('chess-board-container');
    container.innerHTML = '';
    const files = ['a','b','c','d','e','f','g','h'];

    // Top labels
    container.appendChild(document.createElement('div'));
    for (let i = 0; i < 8; i++) {
        const label = document.createElement('div');
        label.className = 'chess-label top';
        if (isBoardFlipped) {
            label.textContent = files[7 - i];
        } else{
            label.textContent = files[i];
        }
        container.appendChild(label);
    }
    container.appendChild(document.createElement('div'));

    // If the board is flipped, we need to reverse the boardArray for rendering
    let boardArray = boardArrayParam;
    // also reverse the rows rendering order if flipped
    if (isBoardFlipped) {
        boardArray = boardArrayParam.slice().reverse().map(row => row.slice().reverse());
        minRow = 7; maxRow = 0;
    } else {
        minRow = 0; maxRow = 7;   
    }    

    // Board rows with side labels
    for (let row = 8; row >= 1; row--) {
        const boardRowIdx = 8 - row;
        // Left label
        const leftLabel = document.createElement('div');
        leftLabel.className = 'chess-label left';

        if (isBoardFlipped) {
            leftLabel.textContent = 9 - row;
        } else {
            leftLabel.textContent = row;
        }
        container.appendChild(leftLabel);

        // Squares
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'chess-square ' + ((row + col) % 2 === 0 ? 'white' : 'black') + " grabbing";
            square.dataset.row = boardRowIdx;
            square.dataset.col = col;

            // Drag and drop events for squares
            square.addEventListener('dragover', function(e) {
                e.preventDefault();
            });

            // CORE - Drop event
            square.addEventListener('drop', function(e) {
                e.preventDefault();

                // if board is flipped, we need to adjust the row and col to match the actual boardArray
                if (isBoardFlipped){
                    square.dataset.row = 7 - parseInt(square.dataset.row);
                    square.dataset.col = 7 - parseInt(square.dataset.col);
                    console.log("After flip:", square.dataset.row, square.dataset.col);
                    draggedFrom = { row: 7 - draggedFrom.row, col: 7 - draggedFrom.col};
                }

                // Check first if the move is allowed
                if (allowedMovesPendingToConfirm.length > 0) {
                    const to = { row: parseInt(square.dataset.row), col: parseInt(square.dataset.col) };
                    const isAllowed = allowedMovesPendingToConfirm.some(m => m.row === to.row && m.col === to.col);
                    if (!isAllowed) {
                        // Invalid move, ignore
                        return;
                    }   
                } 
                const from = draggedFrom;
                const to = { row: parseInt(square.dataset.row), col: parseInt(square.dataset.col) };
                if (from && (from.row !== to.row || from.col !== to.col)) {
                    // Move piece in boardArray
                    boardArray[to.row][to.col] = boardArray[from.row][from.col];
                    boardArray[from.row][from.col] = null;
                    
                    // if is a castling move, move the rook too - It's a Kinkg doing a move
                    if (boardArray[to.row][to.col] && boardArray[to.row][to.col].name[1] === 'K') {
                        // Kinkg can castle, no matter if white or black
                        const castlingMove = allowedMovesPendingToConfirm.find(m => m.row === to.row && m.col === to.col && m.castling);
                        if (castlingMove) {
                            // Now have to check if is white or black
                            if(boardArray[to.row][to.col].name[0] === 'w'){
                                if (castlingMove.castling === 'K') {
                                    // Kingside
                                    boardArray[to.row][to.col - 1] = boardArray[to.row][7];
                                    boardArray[to.row][7] = null;
                                } else if (castlingMove.castling === 'Q') {
                                    // Queenside
                                    boardArray[to.row][to.col + 1] = boardArray[to.row][0];
                                    boardArray[to.row][0] = null;
                                }
                            } else { // black
                                if (castlingMove.castling === 'K') {
                                    // Kingside
                                    boardArray[to.row][to.col - 1] = boardArray[to.row][7];
                                    boardArray[to.row][7] = null;
                                } else if (castlingMove.castling === 'Q') {
                                    // Queenside
                                    boardArray[to.row][to.col + 1] = boardArray[to.row][0];
                                    boardArray[to.row][0] = null;
                                }
                            }
                        }
                    }


                    draggedFrom = null;
                    renderChessBoard(squareSize, boardArray);
                    // Log the move
                    if (boardArray[to.row][to.col]) {
                        logMove(from, to, boardArray[to.row][to.col]); 
                    }
                }
            });

            // Touch support for drop
            square.addEventListener('touchend', function(e) {
                if (draggedFrom) {
                    const to = { row: parseInt(square.dataset.row), col: parseInt(square.dataset.col) };
                    if (draggedFrom.row !== to.row || draggedFrom.col !== to.col) {
                        boardArray[to.row][to.col] = boardArray[draggedFrom.row][draggedFrom.col];
                        boardArray[draggedFrom.row][draggedFrom.col] = null;
                        if (boardArray[to.row][to.col]) {
                            logMove(draggedFrom, to, boardArray[to.row][to.col]);
                        }
                        draggedFrom = null;
                        renderChessBoard(squareSize, boardArray);
                    }
                }
            });

            // CORE for movement !!! Here is the logic to allow moving pieces
            // First of all: If boardArray is provided, show piece image if present
            if (boardArray && boardArray[boardRowIdx] && boardArray[boardRowIdx][col]) {
                const piece = boardArray[boardRowIdx][col];
                const img = document.createElement('img');
                img.src = piece.src;
                img.alt = piece.name;
                img.style.width = '100%';
                img.style.height = '100%';
                img.draggable = true;

                // Add the drag event to the piece
                img.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.dropEffect = 'move';
                    e.dataTransfer.setData('text/plain', 'Moviendo pieza');
                    draggedFrom = { row: boardRowIdx, col: col };
                    
                    // TODO: call main move function
                    movePiece(piece, draggedFrom);

                });

                // Touch support for drag
                img.addEventListener('touchstart', function(e) {
                    draggedFrom = { row: boardRowIdx, col: col };
                    img.classList.add('dragging');
                    e.stopPropagation();
                });
                img.addEventListener('touchend', function(e) {
                    img.classList.remove('dragging');
                    draggedFrom = null;
                });
                img.addEventListener('touchmove', function(e) {
                    // Prevent scrolling while dragging
                    e.preventDefault();
                    // Optionally, you could implement a visual drag image here
                });

                square.appendChild(img);
            }
            container.appendChild(square);
                
        }
        // Right label
        const rightLabel = document.createElement('div');
        rightLabel.className = 'chess-label right';
        if (isBoardFlipped) {
            rightLabel.textContent = 9 - row;
        } else {    
            rightLabel.textContent = row;
        }
        container.appendChild(rightLabel);
    }

    // Now we reverse the boardArray back if it was flipped just to keep logic consistent
    if (isBoardFlipped) {
        boardArray = boardArrayParam;
    }
    // Bottom labels
    container.appendChild(document.createElement('div'));
    for (let i = 0; i < 8; i++) {
        const label = document.createElement('div');
        label.className = 'chess-label bottom';
        if (isBoardFlipped) {
            label.textContent = files[7 - i];
        } else{
            label.textContent = files[i];
        }
        container.appendChild(label);
    }
    container.appendChild(document.createElement('div'));
}

// CORE: Main movement function 
function movePiece(piece, position) {

    // If board is flipped, we need to adjust the row and col to match the actual boardArray
    if (isBoardFlipped){
        position = { row: 7 - position.row, col: 7 - position.col};
        console.log("After flip:", position);
    }
    console.log("Piece selected to move:", piece, "at position:", position);

    // We need to know if it's our turn to move
    if (piece.name[0] == currentTurn()) {
        // CORE: We should now calculate and render the allowed moves for this piece
        allowedMovesPendingToConfirm = allowedMoves(position, piece);
        renderAllowedMoves(allowedMovesPendingToConfirm);
    }else{
        console.log("Not your turn to move");
        clearAllowedMoves();
    }
}

// Renders the allowed moves as dots on the board
function renderAllowedMoves(moves) {
    clearAllowedMoves();
    if (moves.length === 0) return; 
    const container = document.getElementById('chess-board-container');
    moves.forEach(move => {
        
        console.log("Allowed move:", move);

        if (isBoardFlipped){
            // row and col need to be trasposed to match the flipped board
            move = { row: 7 - move.row, col: 7 - move.col};
            console.log("After flip:", move);
        }

        const square = container.querySelector(`.chess-square[data-row='${move.row}'][data-col='${move.col}']`);
        if (square) {
            const dot = document.createElement('img');
            dot.src = '/static/themes/default/pieces/slot.png';
            dot.alt = "Allowed Move!"
            dot.className = 'move-dot';
            dot.id = `move-dot-${move.row}-${move.col}-${move.capture ? 'capture' : 'normal'}-${move.castling ? move.castling : ''}`;
            square.appendChild(dot);
        }
    });
}

// Pawn moves generator
function getPawnMoves(from, color) {
    const moves = [];
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const enemy = color === 'w' ? 'b' : 'w';

    // Forward move
    if (boardArray[from.row + dir] && boardArray[from.row + dir][from.col] === null) {
        moves.push({ row: from.row + dir, col: from.col, capture: false  });
        // Double move from starting position
        if (from.row === startRow && boardArray[from.row + 2 * dir][from.col] === null) {
            moves.push({ row: from.row + 2 * dir, col: from.col , capture: false  } );
        }
    }
    // Captures
    for (let dc of [-1, 1]) {
        const r = from.row + dir, c = from.col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && boardArray[r][c] && boardArray[r][c].name[0] === enemy) {
            moves.push({ row: r, col: c , capture: true});
        }
    }
    return moves;
}

// Rook moves generator
function getRookMoves(from, color) {    
    const moves = [];
    const enemy = color === 'w' ? 'b' : 'w';
    // Up
    for (let r = from.row - 1; r >= 0; r--) {
        if (boardArray[r][from.col] === null) {
            moves.push({ row: r, col: from.col, capture: false });
        } else {
            if (boardArray[r][from.col].name[0] === enemy) moves.push({ row: r, col: from.col , capture: true });
            break;
        }
    }
    // Down
    for (let r = from.row + 1; r < 8; r++) {
        if (boardArray[r][from.col] === null) {
            moves.push({ row: r, col: from.col, capture: false });
        } else {
            if (boardArray[r][from.col].name[0] === enemy) moves.push({ row: r, col: from.col, capture: true });
            break;
        }
    }
    // Left
    for (let c = from.col - 1; c >= 0; c--) {
        if (boardArray[from.row][c] === null) {
            moves.push({ row: from.row, col: c, capture: false });
        } else {
            if (boardArray[from.row][c].name[0] === enemy) moves.push({ row: from.row, col: c, capture: true });
            break;
        }
    }
    // Right
    for (let c = from.col + 1; c < 8; c++) {
        if (boardArray[from.row][c] === null) {
            moves.push({ row: from.row, col: c, capture: false });
        } else {
            if (boardArray[from.row][c].name[0] === enemy) moves.push({ row: from.row, col: c, capture: true });
            break;
        }
    }
    return moves;
}

// Bishop moves generator
function getBishopMoves(from, color) {
    const moves = [];
    const enemy = color === 'w' ? 'b' : 'w';
    // Four diagonals
    for (let dr = -1; dr <= 1; dr += 2) {
        for (let dc = -1; dc <= 1; dc += 2) {
            let r = from.row + dr, c = from.col + dc;
            while (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (boardArray[r][c] === null) {
                    moves.push({ row: r, col: c, capture: false });
                } else {
                    if (boardArray[r][c].name[0] === enemy) moves.push({ row: r, col: c, capture: true });
                    break;
                }
                r += dr;
                c += dc;
            }
        }
    }
    return moves;
}

// Queen moves generator
function getQueenMoves(from, color) {
    // Queen = Rook + Bishop
    return [
        ...getRookMoves(from, color),
        ...getBishopMoves(from, color)
    ];
}

// Knight moves generator
function getKnightMoves(from, color) {
    const moves = [];
    const enemy = color === 'w' ? 'b' : 'w';
    const knightJumps = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightJumps) {
        const r = from.row + dr, c = from.col + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            if (boardArray[r][c] === null || boardArray[r][c].name[0] === enemy) {
                moves.push({ row: r, col: c, capture: boardArray[r][c] !== null  } );
            }
        }
    }
    return moves;
}

// King moves generator
function getKingMoves(from, color) {
    const moves = [];
    const enemy = color === 'w' ? 'b' : 'w';
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = from.row + dr, c = from.col + dc;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                if (boardArray[r][c] === null || boardArray[r][c].name[0] === enemy) {
                    moves.push({ row: r, col: c, capture: boardArray[r][c] !== null  } );
                }
            }
        }
    }
    // Check for castling is available
    if (color === 'w' && from.row === 7 && from.col === 4) {
        if (castlingRights.wK && boardArray[7][5] === null && boardArray[7][6] === null) {
            moves.push({ row: 7, col: 6, castling: 'K' });
        }
        if (castlingRights.wQ && boardArray[7][3] === null && boardArray[7][2] === null && boardArray[7][1] === null) {
            moves.push({ row: 7, col: 2, castling: 'Q' });
        }
    } else if (color === 'b' && from.row === 0 && from.col === 4) {
        if (castlingRights.bK && boardArray[0][5] === null && boardArray[0][6] === null) {
            moves.push({ row: 0, col: 6, castling: 'K' });
        }
        if (castlingRights.bQ && boardArray[0][3] === null && boardArray[0][2] === null && boardArray[0][1] === null) {
            moves.push({ row: 0, col: 2, castling: 'Q' });
        }
    }

    console.log("King moves:", moves);
    
    return moves;
}

// Calculates the available squares for a piece having its position and type calculating the boardArray positions
function allowedMoves(from, piece) {
    const moves = [];
    if (piece === null) return moves;
    const color = piece.name[0];
    switch (piece.name[1]) {
        case 'P': // Pawn
        case 'p':
            return getPawnMoves(from, color);
        case 'R': // Rook
        case 'r':
            return getRookMoves(from, color);
        case 'B': // Bishop
        case 'b':
            return getBishopMoves(from, color);
        case 'Q': // Queen
        case 'q':
            return getQueenMoves(from, color);
        case 'N': // Knight
        case 'n':
            return getKnightMoves(from, color);
        case 'K': // King
        case 'k':
            return getKingMoves(from, color);
        case 'P': // Pawn
        case 'p':
            return getPawnMoves(from, color);
        case 'R': // Rook
        case 'r':
            return getRookMoves(from, color);
        default: break;
    }
    return moves;
}

// The following function will clear the allowed moves from the board one no pice is being dragged
function clearAllowedMoves(){
    document.querySelectorAll('.move-dot').forEach(dot=>{
        dot.remove();
    });
}       


// 2) - Auxiliary functions 
// -----------------------------------------------------------------------------

// Helper to set board square size and re-render
function setChessBoardSize(size) {
    renderChessBoard(size, boardArray);
}

// Loggin moves in moveLog using PGN notation
function logMove(from, to, piece) {
    const files = ['a','b','c','d','e','f','g','h'];
    const ranks = ['1','2','3','4','5','6','7','8'];
    const fromSquare = files[from.col] + ranks[7 - from.row];
    const toSquare = files[to.col] + ranks[7 - to.row];
    const pieceNotation = piece.name[1]; // 'K', 'Q', 'R', 'B', 'N', 'P'
    const moveNotation = (pieceNotation === 'P' ? '' : pieceNotation) + fromSquare + toSquare;
    moveLog.push(moveNotation);
    console.log("Move logged:", moveNotation);
}

// Showing the PGN file in console
function showPGN() {
    let pgn = "[Event \"?\"]\n[Site \"?\"]\n[Date \"????.??.??\"]\n[Round \"?\"]\n[White \"?\"]\n[Black \"?\"]\n[Result \"*\"]\n\n";
    for (let i = 0; i < moveLog.length; i++) {
        if (i % 2 === 0) {
            pgn += ((i / 2) + 1) + ". ";
        }
        pgn += moveLog[i] + " ";
    }
    pgn += "*";
    console.log("PGN:\n" + pgn);
}

// Board to FEN string of the current board position
function boardArrayToFEN(boardArray) {
    let fen = '';
    for (let r = 0; r < 8; r++) {
        let emptyCount = 0;
        for (let c = 0; c < 8; c++) {
            const piece = boardArray[r][c];
            if (piece === null) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fen += emptyCount.toString();
                    emptyCount = 0;
                }
                // Map pieceImages name back to FEN letter
                const pieceLetter = Object.keys(fenToPieceName).find(key => fenToPieceName[key] === piece.name);
                fen += pieceLetter || '';
            }
        }
        if (emptyCount > 0) {
            fen += emptyCount.toString();
        }
        if (r < 7) fen += '/';
    }
    
    return fen + ` ${moveLog.length % 2 === 0 ? 'w' : 'b'} ${castlingString} ${enPassantTarget} ${halfmoveClock} ${fullmoveNumber}`;
}

// Update PGN textarea content
// This function wraps the original logMove to also update castling rights, en passant target, and move counters
const originalLogMove = logMove;
logMove = function(from, to, piece) {
    originalLogMove(from, to, piece);
    updateCastlingRights(from, to, piece);
    updateEnPassantTarget(from, to, piece);
    updateMoveCounters(from,to,piece);
    updatePGNTextArea();
};

// 3) - ALL FEN auxiliar functions to keep FEN fields updated
// ----------------------------------------------------------------------------- 

// This function will check and update castling rights based on moves
function updateCastlingRights(from, to, piece) {
    if (piece.name === 'wK') {
        castlingRights.wK = false;
        castlingRights.wQ = false;
    } else if (piece.name === 'bK') {
        castlingRights.bK = false;
        castlingRights.bQ = false;
    } else if (piece.name === 'wR') {
        if (from.row === 7 && from.col === 0) castlingRights.wQ = false; // a1 rook
        else if (from.row === 7 && from.col === 7) castlingRights.wK = false; // h1 rook
    } else if (piece.name === 'bR') {
        if (from.row === 0 && from.col === 0) castlingRights.bQ = false; // a8 rook
        else if (from.row === 0 && from.col === 7) castlingRights.bK = false; // h8 rook
    }
    // Update castlingString
    castlingString = '';
    if (castlingRights.wK) castlingString += 'K';
    if (castlingRights.wQ) castlingString += 'Q';
    if (castlingRights.bK) castlingString += 'k';
    if (castlingRights.bQ) castlingString += 'q';
    if (castlingString === '') castlingString = '-';
}

// This function calculates en passant target square based on the last move
function updateEnPassantTarget(from, to, piece) {
    if (piece.name === 'wP' && from.row === 6 && to.row === 4) {
        // White pawn moved two squares
        const files = ['a','b','c','d','e','f','g','h'];
        enPassantTarget = files[to.col] + '3';
    } else if (piece.name === 'bP' && from.row === 1 && to.row === 3) {
        // Black pawn moved two squares
        const files = ['a','b','c','d','e','f','g','h'];
        enPassantTarget = files[to.col] + '6';
    } else {
        enPassantTarget = '-';
    }
}

// This function updates halfmove clock and fullmove number
function updateMoveCounters(from,to,piece) {    
    if (piece.name[1] === 'P' || moveLog.length > 0 && boardArray[to.row][to.col] !== null) {
        halfmoveClock = 0;
    } else {
        halfmoveClock++;
    }
    if (piece.name[0] === 'b') {
        fullmoveNumber++;
    }
}

// This function checks who is moving returning 'w' or 'b'
function currentTurn() {
    return moveLog.length % 2 === 0 ? 'w' : 'b';
}

// This function calculates en passant target square based on the last move
function updateEnPassantTarget(from, to, piece) {
    if (piece.name === 'wP' && from.row === 6 && to.row === 4) {
        // White pawn moved two squares
        const files = ['a','b','c','d','e','f','g','h'];
        enPassantTarget = files[to.col] + '3';
    } else if (piece.name === 'bP' && from.row === 1 && to.row === 3) {
        // Black pawn moved two squares
        const files = ['a','b','c','d','e','f','g','h'];
        enPassantTarget = files[to.col] + '6';
    } else {
        enPassantTarget = '-';
    }
}

// This function updates halfmove clock and fullmove number
function updateMoveCounters(from,to,piece) {    
    if (piece.name[1] === 'P' || moveLog.length > 0 && boardArray[to.row][to.col] !== null) {
        halfmoveClock = 0;
    } else {
        halfmoveClock++;
    }
    if (piece.name[0] === 'b') {
        fullmoveNumber++;
    }
}
