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

// Win popup logic
function showWinPopup(winner, reason) {
        const p1 = document.getElementById('player1-name').value || '?';
        const p2 = document.getElementById('player2-name').value || '?';
        const winnerName = winner === 'White' ? p1 : (winner === 'Black' ? p2 : 'Both Players');
        
        let html = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #4a90e2; font-size: 2em; margin-bottom: 15px;">🎉 Game Over! 🎉</h2>
                <div style="font-size: 1.8em; margin: 20px 0; color: #2c3e50;">
                    <strong>${winner === 'Draw' ? '🤝 Draw' : '👑 ' + winnerName + ' Wins'}</strong>
                </div>
                <div style="font-size: 1.2em; color: #666; margin-bottom: 20px;">
                    ${reason}
                </div>
                <button id="win-close-btn" style="background: #4a90e2; color: white; border: none; padding: 12px 24px; font-size: 1em; border-radius: 6px; cursor: pointer;">Play Again</button>
            </div>
        `;
        
        showModalDialog(html);
        document.getElementById('win-close-btn').onclick = function() {
                hideModalDialog();
                resetGame();
        };
}

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

const now = new Date()
const dateGame = now.getFullYear() + '.' + now.getMonth() + '.' + now.getDay();
// PGN area update logic
function updatePGNTextArea() {
    let p1 = document.getElementById('player1-name').value || 'White';
    let p2 = document.getElementById('player2-name').value || 'Black';

    let pgn = `[Event "Casual"]\n[Site "ChachiChessClub"]\n[Date "${dateGame}"]\n[Round "?"]\n[White "${p1}"]\n[Black "${p2}"]\n[Result "*"]\n\n`;
    let lastMoveVisible = moveLog.length;
    if (timeMachineStep>0) lastMoveVisible = timeMachineStep;

    for (let i = 0; i < lastMoveVisible; i++) {
        if (i % 2 === 0) pgn += ((i / 2) + 1) + ". ";
        pgn += moveLog[i] + " ";
    }

    if( lastMoveVisible==0 ) pgn += "*";
    if( lastMoveVisible > 0 && moveLog[lastMoveVisible-1].indexOf("#") <=0 &&  moveLog[lastMoveVisible-1].indexOf("1/2-1/2")<=0 ) pgn += "*";


    document.getElementById('pgn-area').value = pgn;
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

// TimeMachine button logic
document.getElementById('time-machine-btn').onclick = function(){
    // Display or not
    var timeMachineVisible = document.getElementById('chess-board-timeMachine').style.display;
    document.getElementById('chess-board-timeMachine').style.display = ( timeMachineVisible == "none" ) ? "block":"none";
}

document.addEventListener("keydown", function (e) {
    switch (e.key){
        case "ArrowLeft": if ( document.getElementById('chess-board-timeMachine').style.display=="block" ) timeMachineDo(-1); break;
        case "ArrowRight": if ( document.getElementById('chess-board-timeMachine').style.display=="block" ) timeMachineDo(1); break;
    }
})

// Notification Systems
// ---------------------------------------------------------

const notificationContainer = document.getElementById('notification-container');

/**
 * Show a notification popup
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} image - The image URL (optional)
 * @param {string} type - The notification type: 'success', 'warning', 'error', 'info' (default: 'info')
 * @param {number} duration - How long to show notification in ms (0 = manual close only)
 * @param {Array} actions - Array of action buttons: [{label: 'Button Text', callback: function, isSecondary: false}, ...]
 */
function showNotification(title, message, image = null, type = 'info', duration = 4000, actions = []) {
    const notification = document.createElement('div');
    notification.className = `notification-box ${type}`;
    

    // Play sound
    playSound("a_notify");
    
    // Build image HTML
    const imageHTML = image ? `<div class="notification-image"><img src="${image}" alt="notification"></div>` : '';
    
    // Build actions HTML
    let actionsHTML = '';
    if (actions.length > 0) {
        const actionButtons = actions.map((action, index) => {
            const btnClass = action.isSecondary ? 'notification-btn secondary' : 'notification-btn';
            return `<button class="${btnClass}" data-action="${index}">${action.label}</button>`;
        }).join('');
        actionsHTML = `<div class="notification-actions">${actionButtons}</div>`;
    }
    
    notification.innerHTML = `
        ${imageHTML}
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            ${actionsHTML}
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Close button handler
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.onclick = () => removeNotification(notification);
    
    // Action button handlers
    actions.forEach((action, index) => {
        const btn = notification.querySelector(`[data-action="${index}"]`);
        if (btn) {
            btn.onclick = () => {
                if (action.callback) action.callback();
                removeNotification(notification);
            };
        }
    });
    
    // Auto-close after duration
    if (duration > 0) {
        setTimeout(() => removeNotification(notification), duration);
    }
}

function removeNotification(notification) {
    notification.classList.add('notification-removing');
    setTimeout(() => {
        notification.remove();
    }, 300);
}


// Initial PGN area fill
updatePGNTextArea();