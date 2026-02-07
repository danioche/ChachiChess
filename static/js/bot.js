// Bot js - Integration with bot actions 


// Corpus Bot is the BBDD of the options on results
let corpusBot = [
    { intent: "greetings", 
      chat_en: [ "Hi", "Hello", "How are you?","Cómo estás?", "What's App dude?!","Qué pasó?!" ]
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
      question: true
    }

]; // Array sorted by intentions and responses from bot

let corpusIntent = [
    ["estas,encuentras,ánimo", "filosofia"],
    ["hola,buenas,buenos días,saludos,hi,hello", "greetings"],
    ["adios,bye,byez,ta luego,ciao", "bye"],
    ["tonto,feo,lerdo", "insultos"],
    ["jugar contra un bot,una partida,quiero jugar, te apetece jugar, quieres jugar", "game"],
    ["siguiente movimiento,qué pieza moverías,next move,mueve", "nextMove"]
]

function getRndResponse(max){
    return Math.floor(Math.random()*max);
}

function botAction(){
    // Bot does something with an intention on the user
}

function botSpeaks( lintent ){

    // 
    for( i=0; i < corpusBot.length; i++ ){

        if( corpusBot[i].intent == lintent ){
            let l=corpusBot[i].chat_en.length
            if( corpusBot[i].question ){
                return ( corpusBot[i].chat_en[getRndResponse(l)] + "<br><input type='button' value='Yes'><input type='button' value='No'>");
            }else{
                
                return ( corpusBot[i].chat_en[getRndResponse(l)] );
            }
            
        }
    }

}

// Reads the chat and interacts
function readChat( ltext ){

    var ltext_sane = ltext.toLowerCase();


    for( i=0; i < corpusIntent.length ; i++ ){

        if( corpusIntent[i][0].search(ltext)>=0 ){

            return corpusIntent[i][1];
        }

    }

    return "nada";

}