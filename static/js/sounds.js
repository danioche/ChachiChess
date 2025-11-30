const theme = "static/themes/default/snd/";
const a_move = new Audio( theme+"move-self.mp3");
const a_capture = new Audio( theme+"capture.mp3");
const a_castle = new Audio( theme+"castle.mp3");
const a_promote = new Audio( theme+"promote.mp3");
const a_check = new Audio( theme+"check.mp3");
const a_notify = new Audio( theme+"notify.mp3");

const obj_sounds = { 
    "a_move": a_move, "a_capture": a_capture, 
    "a_castle" : a_castle, "a_promote": a_promote,
    "a_check" : a_check, "a_notify": a_notify
 };

function loadSounds(){
    // Improve.
}

function playSound( lsound = "a_move" ){
    if( lsound ) obj_sounds[ lsound ].play();
}