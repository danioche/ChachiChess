
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

function renderChessBoard(squareSize = 64, boardArrayParam = null) {
    // Set CSS variables for square and label size
    document.documentElement.style.setProperty('--square-size', squareSize + 'px');
    document.documentElement.style.setProperty('--label-size', Math.round(squareSize * 0.8) + 'px');
    const container = document.getElementById('chess-board-container');
    container.innerHTML = '';
    const files = ['a','b','c','d','e','f','g','h'];
    // Top labels
    container.appendChild(document.createElement('div'));
    for (let i = 0; i < 8; i++) {
        const label = document.createElement('div');
        label.className = 'chess-label top';
        label.textContent = files[i];
        container.appendChild(label);
    }
    container.appendChild(document.createElement('div'));
    // Board rows with side labels
    for (let row = 8; row >= 1; row--) {
        const boardRowIdx = 8 - row;
        // Left label
        const leftLabel = document.createElement('div');
        leftLabel.className = 'chess-label left';
        leftLabel.textContent = row;
        container.appendChild(leftLabel);
        // Squares
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'chess-square ' + ((row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = boardRowIdx;
            square.dataset.col = col;

            // Drag and drop events for squares
            square.addEventListener('dragover', function(e) {
                e.preventDefault();
            });
            square.addEventListener('drop', function(e) {
                e.preventDefault();
                const from = draggedFrom;
                const to = { row: parseInt(square.dataset.row), col: parseInt(square.dataset.col) };
                if (from && (from.row !== to.row || from.col !== to.col)) {
                    // Move piece in boardArray
                    boardArray[to.row][to.col] = boardArray[from.row][from.col];
                    boardArray[from.row][from.col] = null;
                    draggedFrom = null;
                    renderChessBoard(squareSize, boardArray);
                    // Log the move
                    if (boardArray[to.row][to.col]) {
                        logMove(from, to, boardArray[to.row][to.col]); 
                    }
                }
            });

            // If boardArray is provided, show piece image if present
            if (boardArray && boardArray[boardRowIdx] && boardArray[boardRowIdx][col]) {
                const piece = boardArray[boardRowIdx][col];
                const img = document.createElement('img');
                img.src = piece.src;
                img.alt = piece.name;
                img.style.width = '100%';
                img.style.height = '100%';
                img.draggable = true;
                img.addEventListener('dragstart', function(e) {
                    draggedFrom = { row: boardRowIdx, col: col };
                });
                square.appendChild(img);
            }
            container.appendChild(square);
        }
        // Right label
        const rightLabel = document.createElement('div');
        rightLabel.className = 'chess-label right';
        rightLabel.textContent = row;
        container.appendChild(rightLabel);
    }
    // Bottom labels
    container.appendChild(document.createElement('div'));
    for (let i = 0; i < 8; i++) {
        const label = document.createElement('div');
        label.className = 'chess-label bottom';
        label.textContent = files[i];
        container.appendChild(label);
    }
    container.appendChild(document.createElement('div'));
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
