// Modal dialog logic
// -----------------------------------------------------------------------------

function showModalDialog(html) {
        const modal = document.getElementById('modal-dialog');
        document.getElementById('modal-content').innerHTML = html;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
}
function hideModalDialog() {
        document.getElementById('modal-dialog').style.display = 'none';
        document.body.style.overflow = '';
}
document.getElementById('modal-close-btn').onclick = hideModalDialog;
document.getElementById('modal-dialog').onclick = function(e) {
        if (e.target === this) hideModalDialog();
};

// Buttons and actions logics
// -----------------------------------------------------------------------------

// FEN button logic
document.getElementById('fen-btn').onclick = function() {
    const fen = boardArrayToFEN(boardArray);
    // Show the FEN string in the modal dialog DIV
    showModalDialog("<h3>Current FEN:</h3><input type=text size='"+ fen.length +"' style='font-family:monospace; word-break:break-all;' value='" + fen + "'/>");

}; 

// Side Menu PGN panel logic and updates
// Side menu toggle logic
const sideMenu = document.getElementById('side-menu');
const sideMenuToggle = document.getElementById('side-menu-toggle');
sideMenuToggle.onclick = () => {
    sideMenu.classList.toggle('open');
};

// PGN area update logic
function updatePGNTextArea() {
    const pgnArea = document.getElementById('pgn-area');
    let p1 = document.getElementById('player1-name').value || '?';
    let p2 = document.getElementById('player2-name').value || '?';
    let pgn = `[Event "?"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "${p1}"]\n[Black "${p2}"]\n[Result "*"]\n\n`;
    for (let i = 0; i < moveLog.length; i++) {
        if (i % 2 === 0) pgn += ((i / 2) + 1) + ". ";
        pgn += moveLog[i] + " ";
    }
    pgn += "*";
    pgnArea.value = pgn;
}

// Update PGN area when player names change
document.getElementById('player1-name').addEventListener('input', updatePGNTextArea);
document.getElementById('player2-name').addEventListener('input', updatePGNTextArea);

// Restart button logic
document.getElementById('restart-btn').onclick = function() {
    resetGame();
};

// Flip Board button logic - Is kind of resetting the game too
document.getElementById('flip-board-btn').onclick = function() {
    isBoardFlipped = !isBoardFlipped;
    boardArray = fenToBoardArray(initialFEN);
    moveLog.length = 0;
    renderChessBoard(64, boardArray);
    updatePGNTextArea();
}

// Initial PGN area fill
updatePGNTextArea();