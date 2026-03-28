// Bot js - Integration with bot actions 
// TODO: Add the change of teacher mood and room interaction


// Sounds for bots to speak 
const teacher_snd = "static/themes/default/teachers/snd/";

// Preload the sounds
const chat_greetings = new Audio( teacher_snd+"duke_nukem_sounds_KickAssChewGum.wav" );

// ----- Corpus // Understanding the user
// Corpus Bot is the BBDD of the options on results
// TODO: Quite a lot improvements here, this is veeery basic

// Array sorted by intentions and responses from bot
// Mainly : What the bot guess that it should respond
let corpusBot = [
    { intent: "greetings", 
      chat_en: [ "Hi", "Hello", "How are you?","Cómo estás?", "What's App dude?!","Qué pasó?!" ],
      chat_en_snd: chat_greetings 
    },
    { intent: "bye",
      chat_en: [ "Bye", "Sayonara baby!" ]
    },
    { intent: "insultos",
      chat_en: [ "Eso tu", "Rebota, rebota y en tu culo explota" ]
    },
    { intent: "game",
      chat_en: [ "Claro, vamos a jugar", "Si por supuesto, juguemos" ]
    },
    { intent: "nextMove",
      chat_en: [ "Quieres que mueva?", "Te parece si muevo?" ],
      question: true,
      action: [ "addBotMesage('🤔 Déjame pensar...')", "nextMoveAsk()"] // Puntero a la función
    },
    {
      intent: "estudiar",
      chat_en: [ "Claro! Estudiemos!", "Venga! Vamos con una lección!" ],
      action: [ "lessonWorker()" ]
    },
    { intent: "retry",
      chat_en: [ "Quieres volver a intentarlo?", "Lo intentamos de nuevo?" ],
      question: true,
      action: [ "addBotMesage('OK reiniciamos...')", "lessonWorker()" ] 
    }

]; 

// Understanding the user by keywords and translating to intents
let corpusIntent = [
    ["estas,encuentras,cómo,estás,ánimo", "filosofia"],
    ["hola,buenas,buenos días,saludos,hi,hello", "greetings"],
    ["adios,bye,byez,ta luego,ciao", "bye"],
    ["tonto,feo,lerdo,cara culo,cara anchoa", "insultos"],
    ["jugar contra un bot,una partida,quiero jugar, te apetece jugar, quieres jugar", "game"],
    ["siguiente movimiento,qué pieza moverías,next move,mueve,mueves,cuál sería tu siguiente movimiento", "nextMove"],
    ["lección,practicar,estudiar","estudiar"]
];

// Function - interoperation between intents and functions
// mainly the program calling itself
let functionStack = [];

// UI - related objects 
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');


// Tool for randomize a bit
function getRndResponse(max){
    return Math.floor(Math.random()*max);
}

// Bot does something with an intention on the user
function botAction(){
    
    for(i=0; i<functionStack.length; i++){
        try{
            eval( functionStack[i] );
            console.info( "Bot action:: Executing..." + functionStack[i]);
        } catch (myExc){
            console.info( "Bot action:: No pudo ejecutar " + functionStack[i]);
        } 
    }
}

// This function is to response to an intent
function botSpeaks( lintent ){
    // 
    for( i=0; i < corpusBot.length; i++ ){

        if( corpusBot[i].intent == lintent ){
            let l=corpusBot[i].chat_en.length
            let response = "";
            if( corpusBot[i].chat_en_snd ) corpusBot[i].chat_en_snd.play();
            if( corpusBot[i].action      ){ functionStack = corpusBot[i].action; console.log( functionStack ); }
            if( corpusBot[i].question    ){
                response = corpusBot[i].chat_en[getRndResponse(l)] + "<br><input onclick='botAction()' type='button' value='Yes'><input onclick='return false;' type='button' value='No'>";
            } else {
                response = corpusBot[i].chat_en[getRndResponse(l)]; botAction();
            }
            return response;
        }
    }
    return false;
}

// Reads the chat and interacts
function readChat( ltext ){

    var ltext_sane = ltext.toLowerCase();

    for( i=0; i < corpusIntent.length ; i++ ){

        if( corpusIntent[i][0].search(ltext_sane)>=0 ){

            return corpusIntent[i][1];
        }

    }

    // Improvement... to learn!!
    return "don't get it, sorry";

}

// These are async functions to avoid UI gets blocked 
// during the bot time of "thinking"
async function getBotResponse( lmsg ){

    return ( botSpeaks( readChat(lmsg) ) );

}

// Utility tool to add message, UI dependent.
function addBotMesage( lmsg ){
    const msg = lmsg+"";
    if (msg) {
        const div = document.createElement('div');
        div.innerHTML = '<img src="/static/themes/default/teachers/daniocheChessTeacher_avatar2.png" alt="Teacher Avatar" style="vertical-align:middle; border-radius:50%; margin-right:6px;" width="32px">' + msg;
        div.style.margin = '6px 0';
        div.style.padding = '6px 10px';
        div.style.textAlign = 'right';
        div.style.background = '#f1ffff';
        div.style.borderRadius = '5px';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// UI dependent - This is the function that *runs/rules the chat*
//  - TODO: Probably this can be modularized more structured

// A new message msg has been sent to the chat 
//   - Send
//   - Analyze by the Bot
//   - Answer 
chatForm.onsubmit = function(e) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (msg) {
        const div = document.createElement('div');
        div.textContent = msg;
        div.style.margin = '6px 0';
        div.style.padding = '6px 10px';
        div.style.background = '#f1f3fa';
        div.style.borderRadius = '5px';
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = '';

        // We interact with bot
        // The best here is to include a promise call (chat can spend time)
        getBotResponse(msg).then( addBotMesage );
        
    }
};
