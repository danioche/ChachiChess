/*
** Clock management - logic 
**
** TODOs:
**
*/

let time = 1; // Minutes configured by default
let clockTimer = [0,0]; // 0: White , 1: Black
let toggler = 0;
let flag = -1; // -1 no flag yet

// To kill or not the interval
let clockInterval;

function resetClock(){
    clockTimer[0] = clockTimer[1] = time * (60000);
    flag = -1;
    document.getElementById("whiteTimer").value = showBest(clockTimer[0]);
    document.getElementById("blackTimer").value = showBest(clockTimer[1]);
}

function runClock(){
    clockTimer[ toggler ] -= 10; 
    flag = (clockTimer[ toggler ]==0)? toggler : -1;
}

function showBest(millis){
    const d = new Date(Date.UTC(0,0,0,0,0,0,millis));
    // Pull out parts of interest
    parts = [
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds()
    ];
    // Zero-pad
    return (
        parts[0]+":"+parts[1]+"."+parts[2]
        //parts.map(s => String(s).padStart(2,'0')).join(':')
    );
}

function renderClock(){
    if( flag == -1){
        toggleClock();
        runClock();
        document.getElementById("whiteTimer").value = showBest(clockTimer[0]);
        document.getElementById("blackTimer").value = showBest(clockTimer[1]);
    }else{
        if(toggler==0)
            document.getElementById("clock-white").innerHTML="🚩";
        else
            document.getElementById("clock-black").innerHTML="🚩";
        const winner = toggler === 0 ? 'Black' : 'White';
        showWinPopup(winner, "Flagged Oponent")
    }
    
}

function toggleClock(){
    lasttoggle = toggler;
    toggler = whosMoving%2;
    if (lasttoggle!=toggler){
        updateClocksIcos();
    }
}

function startClock(){
    resetClock();
    clockInterval = setInterval( renderClock, 1 );
}

function updateClocksIcos(){

    cIconsArray =[ document.getElementById("clock-black"),
                   document.getElementById("clock-white") ];
    backsArray =[ document.getElementById("blackTimer"),         
                  document.getElementById("whiteTimer")
                ];

    cIconsArray[ toggler ].innerHTML="⏱"; backsArray[ toggler ].style = "background:white;color:black;";
    cIconsArray[ (toggler+1)%2 ].innerHTML="⏱️"; ; backsArray[ (toggler+1)%2 ].style= "background:black;color:white;";
}


document.getElementById('clock-btn').onclick = function(){

    clockConfig();
}

// Pop-up for Config the clock
function clockConfig(winner, reason) {
        const p1 = document.getElementById('player1-name').value || '?';
        const p2 = document.getElementById('player2-name').value || '?';
        const winnerName = winner === 'White' ? p1 : (winner === 'Black' ? p2 : 'Both Players');
        
        let html = `
            <div style="text-align: center; padding: 20px;">
                <h2 style="color: #4a90e2; font-size: 2em; margin-bottom: 15px;">⏳ Clock Configuration ⚙️</h2>
                Select the time for the clock (minutes)
                <br/><br/><br/><br/>
                <input id="clock-btn-1" class="clock-btn" type="button" value=" 1" onclick="toggleClockTime(this)">&nbsp;
                <input id="clock-btn-3" class="clock-btn" type="button" value=" 3" onclick="toggleClockTime(this)">&nbsp;
                <input id="clock-btn-5" class="clock-btn" type="button" value=" 5" onclick="toggleClockTime(this)">&nbsp;
                <input id="clock-btn-10" class="clock-btn" type="button" value="10" onclick="toggleClockTime(this)">&nbsp;
                <input id="clock-btn-60" class="clock-btn" type="button" value="60" onclick="toggleClockTime(this)">
                <br/><br/>
                <button id="win-close-btn" style="background: #4a90e2; color: white; border: none; padding: 12px 24px; font-size: 1em; border-radius: 6px; cursor: pointer;">Play!</button>
            </div>
        `;
        
        showModalDialog(html);
        document.getElementById('win-close-btn').onclick = function() {
                hideModalDialog();
                resetGame();
                startClock();
        };
}

function toggleClockTime( lObj ){

    newMinutes = lObj.id.split("-")[2];
    time = parseInt(newMinutes,10);
    resetClock();
    aButtons = [1,3,5,10,60];
    for( i=0; i<aButtons.length; i++){
        document.getElementById("clock-btn-"+aButtons[i]).className = "clock-btn";
    }
    lObj.className = "clock-btn-on";
    updateClocksIcos();
}