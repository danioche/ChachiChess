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

// Different testing/starting positions in FEN for debugging
const startBoard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const nowsBlackTrun = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
const onemovetocastle = "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1PP2/5N2/PPPP2PP/RNBQK2R b - - 0 8";
const promotionPawns = "rnbqk2r/pppp1P1p/7N/8/2B4b/8/PPP3pP/RNBQK2R b - - 0 19";
const enPassant = "rnbqkbnr/ppp2ppp/4p3/3pP3/8/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 3";
const enPassantB = "rnbqkbnr/ppp1pppp/8/8/3pP3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3";
const checkTest = "q3k3/8/8/8/8/8/8/4K2Q w - - 0 42";
const lesson= "7k/5ppp/8/8/8/8/8/2R1K3 w KQkq - 0 1";
const lesson2= "7k/5pp1/7p/8/8/8/8/2R1K3 w KQkq - 0 1";
const lesson3= "8/4KP1k/6p1/6P1/8/8/8/8 w KQkq - 0 1";

// Points per piece
const pointsPiece = { "P": 1, "N": 3, "B": 3, "R": 5, "Q": 10 };

// Initial position in FEN
const initialFEN = startBoard;

//
// Note: FEN position is ALL for initial status of the board. The board should be set with fenToBoardArray
//
let boardArray = fenToBoardArray(initialFEN);
let boardSize = 64;
let draggedFrom = null;
let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
let castlingString = initialFEN.split(" ")[2];
let enPassantTarget = initialFEN.split(" ")[3];
let halfmoveClock = initialFEN.split(" ")[4];
let fullmoveNumber = parseInt( initialFEN.split(" ")[5] );
let whosMoving = initialFEN.split(" ")[1] === 'w' ? 0:1; // 0 Whites
let isBoardFlipped = false;
let allowedMovesPendingToConfirm = [];
let timeMachine = []; timeMachine.push( initialFEN ); let timeMachineStep = 0; // board on every status
let kingAttacked = { color: 'w', checked: false, row: 0, col:0 }; 
let scoreBoard = { w:{ points: 0, pieces: [] },
                   b:{ points: 0, pieces: [] } };
let g_move_to_play = ""; // What should I play move, check, checkmate, draw...?

// Board logic =================================================================

// 1) - CORE functions
// -----------------------------------------------------------------------------    

function resetGame(){
    boardArray = fenToBoardArray(initialFEN);
    draggedFrom = null;
    castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
    castlingString = initialFEN.split(" ")[2];
    enPassantTarget = initialFEN.split(" ")[3];
    halfmoveClock = initialFEN.split(" ")[4];
    fullmoveNumber = initialFEN.split(" ")[5];
    whosMoving = initialFEN.split(" ")[1] === 'w' ? 0:1; // 0 Whites
    isBoardFlipped = false;
    moveLog.length = 0;
    scoreBoard = { w:{ points: 0, pieces: [] }, b:{ points: 0, pieces: [] } };
    renderChessBoard(boardSize, boardArray);
    updatePGNTextArea();
    updateScoreboard();
    timeMachine = []; timeMachine.push( initialFEN ); timeMachineStep = 0;
}

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
            if(isBoardFlipped) square.id = files[7-col]+(boardRowIdx+1);
            else square.id = files[col]+(8-boardRowIdx);
            square.className = 'chess-square ' + ((row + col) % 2 === 0 ? 'white' : 'black') + " grabbing";
            square.dataset.row = boardRowIdx;
            square.dataset.col = col;

            // Drag and drop events for squares
            square.addEventListener('dragover', function(e) {
                e.preventDefault();
            });

            // CORE - Drop event -- Finalization of the move
            // TODO: Create auxiliar function to make this more readable
            square.addEventListener('drop', function(e) {
                e.preventDefault();

                return performMove(square, squareSize, e);
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

            // CORE - PIECE CREATIONS IN PLACE 
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
    
    // Update scoreboard
    updateScoreboard();
}

// Needs the info from the "target" square
function performMove(square,squareSize,e){

    // console.log( "Moves available pending to confirm: " + allowedMovesPendingToConfirm.length );

    if (allowedMovesPendingToConfirm.length==0) return;

    // if board is flipped, we need to adjust/transpose the row and col movement to match the actual boardArray
    if (isBoardFlipped){
        square.dataset.row = 7 - parseInt(square.dataset.row);
        square.dataset.col = 7 - parseInt(square.dataset.col);
        // console.log("After flip:", square.dataset.row, square.dataset.col);
        draggedFrom = { row: 7 - draggedFrom.row, col: 7 - draggedFrom.col};
    }

    // Check first if the move is allowed
    if (allowedMovesPendingToConfirm.length > 0) {
        const to = { row: parseInt(square.dataset.row), col: parseInt(square.dataset.col) };
        const isAllowed = allowedMovesPendingToConfirm.some(m => m.row === to.row && m.col === to.col);
        if (!isAllowed) {
            // Invalid move, ignore
            clearAllowedMoves();
            return;
        }   
    } 

    const from = draggedFrom;
    const to = { row: parseInt(square.dataset.row), col: parseInt(square.dataset.col) };
    
    if (from && (from.row !== to.row || from.col !== to.col)) {

        // Check Pawns to promote
        if(
            (boardArray[from.row][from.col].name[1]==='P' && boardArray[from.row][from.col].name[0] ==='w' && to.row === 0 ) || 
            (boardArray[from.row][from.col].name[1]==='P' && boardArray[from.row][from.col].name[0] ==='b' && to.row === 7 )
        )  
        {
            showPromotionModal(e, 
                                /* Piece generation on the fly */ 
                                { name: boardArray[from.row][from.col].name, row: to.row, col: to.col });
        }
        
        g_move_to_play = "a_move";
        // If to - dest is a piece this should be stored on the "score" of the current player
        if (boardArray[to.row][to.col]!=null){
            scorePiece( boardArray[to.row][to.col] );
            g_move_to_play = "a_capture";
        } 

        // Move piece in boardArray
        boardArray[to.row][to.col] = boardArray[from.row][from.col];
        boardArray[from.row][from.col] = null;
        
        // If it's an en-passant move we should remove the pawn captured from the board
        if( allowedMovesPendingToConfirm.find(m => m.row === to.row && m.col === to.col && m.enpassant) ){
            // Depending on direction (white or black) we will remove one or other square
            if(boardArray[to.row][to.col].name[0] === 'w') boardArray[to.row+1][to.col] = null;
            else boardArray[to.row-1][to.col] = null;
        }

        // If is a castling move, move the rook too - It's a Kinkg doing a move
        let castlingMove = null;
        if (boardArray[to.row][to.col] && boardArray[to.row][to.col].name[1] === 'K') {
            // Kinkg can castle, no matter if white or black
            castlingMove = allowedMovesPendingToConfirm.find(m => m.row === to.row && m.col === to.col && m.castling);
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
                boardArray[to.row][to.col].castling = castlingMove.castling; // King has moved log the castling type
            
                g_move_to_play = "a_castle";
            }
        }


        draggedFrom = null;
        renderChessBoard(squareSize, boardArray);
        
        // Log the move
        if (boardArray[to.row][to.col]) {
            logMove(from, to, boardArray[to.row][to.col]); 
        }
        // No pending moves, reset.
        allowedMovesPendingToConfirm = [];
    }

}


// CORE: Main movement function 
function movePiece(piece, position) {

    if(piece.name[0] != currentTurn()){
        // console.log("Not your turn to move");
        return;
    } 

    // If board is flipped, we need to adjust the row and col to match the actual boardArray
    if (isBoardFlipped){
        position = { row: 7 - position.row, col: 7 - position.col};
    }
    
    // CORE: We should now calculate and render the allowed moves for this piece
    allowedMovesPendingToConfirm = allowedMoves(position, piece);

    // CORE: Check if the allowed moves are allowed because of check / checkMate / staleMate
    allowedMovesPendingToConfirm = onlyMovesAvailable( allowedMovesPendingToConfirm, position, piece );
    
    renderAllowedMoves(allowedMovesPendingToConfirm);
}

// CORE: Legal movements
// From all the available moves we inspect in n+1 level which are allowed for the ACTIVE PLAYER
function onlyMovesAvailable( moves, position, piece ){

    //let boardArraySave = copyArrayBoard( boardArray ); // Saving the current board
    let stillCheckedS = {};
    let onlyMoves = [];

    // From all the possible moves
    moves.forEach(
        function(lmove){

            // We simulate the move and then we see if King is still checked so n+1 movements to calculate
            
            // Save
            let fromPiece = boardArray[position.row][position.col]; 
            let toPiece = boardArray[lmove.row][lmove.col];
            
            // Move
            boardArray[position.row][position.col] = null; 
            boardArray[lmove.row][lmove.col] = piece;

            // Is the king still chequed? 
            stillCheckedS = checkKingStatus();
            
            if (!stillCheckedS.checked){
                onlyMoves.push( lmove );
            }

            // Restore
            boardArray[position.row][position.col] = fromPiece; 
            boardArray[lmove.row][lmove.col] = toPiece;
        }
    );
    
    return onlyMoves;
}

// Test if King is Check (Mated) or Stealmated
// Calculating over the boardArray - ALWAYS the "TRUTH"!!! 
// Returns: KingObject pointing the status in regard of checked
// Enemy: Can be a parameter for pinned pieces to check, for normal check will be just the not moving pieces color
function checkKingStatus( enemy = currentTurn()==='w' ? 'b': 'w' ){
    let allEnemyMoves = []; // Moves by the enemy
    let kingPosition = { row: 0, col: 0};
    let player = currentTurn();
    
    
    // We have to calculate all availables movements of the enemy
    for( let r=0; r<8; r++){
        for(let c=0; c<8; c++){
            if( boardArray[r][c]!=null && boardArray[r][c].name[0]===enemy){
                allEnemyMoves.push( allowedMoves( {row: r, col: c}, boardArray[r][c] ) );
            }else{
                if( boardArray[r][c]!=null && boardArray[r][c].name[1]==='K'){
                    kingPosition.row = r; kingPosition.col = c;
                }
            }
        }
    }
    
    let ret =  { color: player, checked: false, mated:false, stealmated:false, row: kingPosition.row, col: kingPosition.col } ;

    // Now we have all the possibles targets of our beloved enemy
    // We should check if the King is attacked first
    allEnemyMoves.forEach(
        function ( lmove ){
            if( lmove && lmove.length>0 ){
                let capturing = lmove.filter( m=> m.capture === true );
                if( capturing.length> 0)
                    capturing.forEach(
                        function ( o ){
                            // When the capture implies the position of the current King you are checked!
                            if ( o.row == kingPosition.row && o.col == kingPosition.col ){
                                // Now you are checked
                                ret.checked = true;
                            }
                        }
                    )
            } 
        }
    );
    

    return ret;
}

// Renders the allowed moves as dots on the board
function renderAllowedMoves(moves) {
    clearAllowedMoves();
    if (moves.length === 0) return; 
    const container = document.getElementById('chess-board-container');
    moves.forEach(move => {
        
        // console.log("Allowed move:", move);

        if (isBoardFlipped){
            // row and col need to be trasposed to match the flipped board
            move = { row: 7 - move.row, col: 7 - move.col, capture: move.capture, enpassant: move.enpassant, castling: move.castling };
            // console.log("After flip:", move);
        }

        const square = container.querySelector(`.chess-square[data-row='${move.row}'][data-col='${move.col}']`);
        if (square) {
            const dot = document.createElement('img');
            dot.src = '/static/themes/default/pieces/slot.png';
            dot.alt = "Allowed Move!"
            dot.className = 'move-dot';
            dot.id = `move-dot-${move.row}-${move.col}-${move.capture ? 'capture' : 'normal'}-${move.castling ? move.castling : ''}`;
            square.appendChild(dot);

            if ( move.capture===true || move.enpassant===true ) {
                square.className += " capture";
            }
        }


    });
}

// This is called when user finally selected the piece to promote
// Params: Piece Obj { name: "wP", row: int, col: int } , choose = ['q','r','b','n']
function promotionFinalle(piece,choose){

    // console.log("Piece:" + piece + " Choose:"+ choose);
    let promotedName = piece.name[0] + choose;
    // TODO: hardcoded path is not good, change!
    boardArray[ piece.row ][ piece.col ] = { name: promotedName, src: './static/themes/default/pieces/'+ promotedName+'.png' }

    // TODO: hardcoded 64 is not good, remove!
    renderChessBoard( 64, boardArray);

    // Now we should log the correct movement we should modify the Log
    moveLog[ moveLog.length - 1 ] = moveLog[ moveLog.length-1 ] + "=" + choose;

    // Play final sound for promotion
    playSound("a_promote");

    // And... we check again the status of the king
    checkKingMateOrSteal();

    // And... update the PGN window
    updatePGNTextArea();

}

// Pawn moves generator
function getPawnMoves(from, color) {
    const moves = [];
    const dir = color === 'w' ? -1 : 1;
    const startRow = color === 'w' ? 6 : 1;
    const enemy = color === 'w' ? 'b' : 'w';
    const files = ['a','b','c','d','e','f','g','h'];
    
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
        
        // Checks en-passant targets available 
        if( color === "w" ){
            if ( files[8-c]+(8-r) == enPassantTarget ) {
                moves.push({ row: r, col: 8-c , capture: true, enpassant: true});
            }
        }else{
            if ( files[c]+(8-r) == enPassantTarget ) {
                moves.push({ row: r, col: c , capture: true, enpassant:true });
            }
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

                    if (boardArray[r][c].name[0] == enemy) moves.push( { row: r, col: c, capture: true } );
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
    document.querySelectorAll('.capture').forEach(square=>{
        square.className = square.className.replace("capture", "");
    });
}       

// The following function stores the captured piece and updates the score
function scorePiece( piece ){
    scoreBoard[ currentTurn() ].points += parseInt(pointsPiece[ piece.name[1] ], 0);
    scoreBoard[ currentTurn() ].pieces.push( piece ); 
}

// Update the visual scoreboard display
function updateScoreboard() {
    // Piece unicode symbols mapping
    const pieceSymbols = {
        'wP': '&#9817;', 'wR': '&#9814;', 'wB': '&#9815;', 'wN': '&#9816;', 'wQ': '&#9813;', 'wK': '&#9812;',
        'bP': '&#9823;', 'bR': '&#9820;', 'bB': '&#9821;', 'bN': '&#9822;', 'bQ': '&#9819;', 'bK': '&#9818;'
    };
    
    // Update White's scoreboard
    const whitePiecesDiv = document.getElementById('white-pieces');
    const whitePointsDiv = document.getElementById('white-points');
    whitePiecesDiv.innerHTML = scoreBoard.w.pieces.map(piece => 
        `<span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center;">${pieceSymbols[piece.name]}</span>`
    ).join('');
    whitePointsDiv.textContent = scoreBoard.w.points;
    
    // Update Black's scoreboard
    const blackPiecesDiv = document.getElementById('black-pieces');
    const blackPointsDiv = document.getElementById('black-points');
    blackPiecesDiv.innerHTML = scoreBoard.b.pieces.map(piece => 
        `<span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center;">${pieceSymbols[piece.name]}</span>`
    ).join('');
    blackPointsDiv.textContent = scoreBoard.b.points;
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
    let capture = ( g_move_to_play == "a_capture" )? "x" : "";

    let moveNotation = (pieceNotation === 'P' ? '' : pieceNotation + fromSquare ) + capture + toSquare;
    // Pawn capturing notation (same for en-passant)
    if (piece.name[1]==='P' && from.col != to.col ){ moveNotation = fromSquare[0] + 'x' + toSquare; };
    // Castling notation
    if (piece.name[1] === 'K' && piece.castling ) { moveNotation = piece.castling === 'K' ? 'O-O' : 'O-O-O'; }
    
    moveLog.push(moveNotation);  
}

function timeMachineDo( time=0 ){

    if (time==0){
        timeMachine.push(  boardArrayToFEN(boardArray) );
        timeMachineStep = timeMachine.length - 1;
    }else{
        var newPos = timeMachineStep + time;
        if ( newPos >= 0 && newPos < timeMachine.length ) timeMachineStep += time;
        else return;
        // console.log(  timeMachine[ timeMachineStep ] );
        boardArray = fenToBoardArray( timeMachine[ timeMachineStep ] );
        // Update visuals
        renderChessBoard(boardSize,boardArray);
        updatePGNTextArea();
    }

    document.getElementById('fwd').disabled = document.getElementById('bwd').disabled = true;
    // Length > 0  
    if (timeMachine.length > 0){
        // We must enable back, now we have movements
        document.getElementById('bwd').disabled = false;
    }
    // We are in the middle of the History? 
    if ( timeMachineStep < timeMachine.length-1 ){
        // We must enable back, now we have movements
        document.getElementById('fwd').disabled = false;
    }
    // No more back moves
    if( timeMachineStep == 0 ){
        document.getElementById('bwd').disabled = true;
    }
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
    
    fen = fen + ` ${moveLog.length % 2 === 0 ? 'w' : 'b'} ${castlingString} ${enPassantTarget} ${halfmoveClock} ${fullmoveNumber}`;
    return fen;
}

// Update PGN textarea content
// This function wraps the original logMove to also update castling rights, en passant target, and move counters
const originalLogMove = logMove;
logMove = function(from, to, piece) {
    originalLogMove(from, to, piece);
    updateCastlingRights(from, to, piece);
    updateEnPassantTarget(from, to, piece);
    updateMoveCounters(from,to,piece);
    timeMachineDo();

    checkKingMateOrSteal();

    updatePGNTextArea();

    playSound( g_move_to_play );
};


//
// CORE - CHECKING MATES 
// 
//
// After a check we enter in a final status - It is a final Mate or a StealMate or can be avoided?
function checkKingMateOrSteal()
{
    let player = currentTurn();
    let allPlayerMoves = [];
    let onlyAllowedPlayerMoves = [];

    let kingAttacked = checkKingStatus();

    // Without any interaction of the user system has to know if there is a checkmate, stealmate or are "forced movements"

    // Prospect all the movements
    for( let r=0; r<8; r++){
        for(let c=0; c<8; c++){
            if( boardArray[r][c]!=null && boardArray[r][c].name[0]===player){
                let temp = allowedMoves( {row: r, col: c}, boardArray[r][c] );
                onlyAllowedPlayerMoves = onlyMovesAvailable( temp, { row: r, col: c }, boardArray[r][c]);
                if ( onlyAllowedPlayerMoves.length > 0 ) allPlayerMoves.push( onlyAllowedPlayerMoves );
            }
        }
    }

    // console.log ( " Player: " + player );
    // console.log ( " King " + kingAttacked.checked + " pos: ( " + kingAttacked.row + "," + kingAttacked.col + ") ");
    // console.log ( " Find " + allPlayerMoves.length + " Movements after check" );

    let king_r = kingAttacked.row;
    let king_c = kingAttacked.col;
    if(isBoardFlipped){
        king_r = 7 - king_r; king_c = 7 - king_c;
    }

    // Evaluating what is happening:

    if ( kingAttacked.checked && allPlayerMoves.length == 0 ){

        // CHECK MATE - game over!!
        const container = document.getElementById('chess-board-container');
        const square = container.querySelector(`.chess-square[data-row='${king_r}'][data-col='${king_c}']`);
        square.className += " checkmate";

        kingAttacked.mated = true;
        moveLog[ moveLog.length - 1 ] = moveLog[ moveLog.length-1 ] + "#";

        // Show win popup
        const winner = player === 'w' ? 'Black' : 'White';
        showWinPopup(winner, 'Checkmate');

        return kingAttacked;
    }

    if ( !kingAttacked.checked && allPlayerMoves.length == 0 ){

        // STEALMATE - game over!!! DRAW!!!
        const container = document.getElementById('chess-board-container');
        const square = container.querySelector(`.chess-square[data-row='${king_r}'][data-col='${king_c}']`);
        square.className += " stealmate";

        kingAttacked.stealmated = true;

        moveLog[ moveLog.length ] = "1/2-1/2";

        // Show draw popup
        showWinPopup('Draw', 'Stalemate');

        return kingAttacked;
    }

    if ( kingAttacked.checked ){

        // CHECK! But game ON!!
        const container = document.getElementById('chess-board-container');
        const square = container.querySelector(`.chess-square[data-row='${king_r}'][data-col='${king_c}']`);
        square.className += " check";

        moveLog[ moveLog.length - 1 ] = moveLog[ moveLog.length-1 ] + "+";

        // Update sound
        g_move_to_play = "a_check";

        return kingAttacked;
    }

}

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
    whosMoving+=1;
}

// This function checks who is moving returning 'w' or 'b'
function currentTurn() {
    
    return  whosMoving%2===0  ? 'w': 'b';
}

// Next move TEST 
async function nextMoveAsk(){
    
    fenToSend = boardArrayToFEN(boardArray);
    
    url = window.location + "/move?fen="+fenToSend;

    try {
        const response = await fetch(url);
        if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
        }

        const result = await response.text();
        console.log(result);

        // Parse UCI move (e.g., "e2e4")
        const uciMove = result.trim();
        let fromCol = uciMove.charCodeAt(0) - 'a'.charCodeAt(0);
        let fromRow = 8 - parseInt(uciMove[1]);
        let toCol = uciMove.charCodeAt(2) - 'a'.charCodeAt(0);
        let toRow = 8 - parseInt(uciMove[3]);

        // Get the piece and perform the move
        const piece = boardArray[fromRow][fromCol];
        if (piece) {
            // console.log("Piece: "+ piece.name + " from: "+ fromRow +","+ fromCol + " to: "+ toRow + ","+ toCol + " targetId: "+ uciMove.substring(2));
            if (isBoardFlipped) draggedFrom = { row: 7-fromRow, col: 7-fromCol };
            else draggedFrom = { row: fromRow, col: fromCol };

            const targetSquare = document.getElementById(uciMove.substring(2));
            if (targetSquare) {
                allowedMovesPendingToConfirm = allowedMoves({row:fromRow,col:fromCol}, piece);
                performMove(targetSquare, boardSize, targetSquare);
            }
        }

    } catch (error) {
        console.error(error.message);
    }
  

}