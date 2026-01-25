// Bot js - Integration with bot actions 


// Corpus Bot is the BBDD of the options on results
let corpusBot = [
    { intent: "greetings", 
      chat_en: [ "Hi", "Hello", "How are you?", "What's App dude?!" ]
    },
    { intent: "bye",
      chat_en: [ "Bye", "Sayonara baby!" ]
    }

]; // Array sorted by intentions and responses from bot

let corpusIntent = [
    ["hola,buenas,buenos días,saludos,hi,hello", "greetings"],
    ["adios,bye,byez,ta luego,ciao","bye"]
]


function botAction(){
    // Bot does something with an intention on the user
}

function botSpeaks( lintent ){

    // 
    for( i=0; i < corpusBot.length; i++ ){

        if( corpusBot[i].intent == lintent ){
            return ( corpusBot[i].chat_en );
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