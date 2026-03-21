
// Lesson integration - Game engine injected with a lesson

// Note: 
// The below is dependent on logMove, this code needs to be interpreted
// once logMove is on memory with all the stuff!

let g_in_lesson_game = false;
let lesson_allowed_moves = []; 
let lesson_tips = [];
let lesson_nok_chats = [];
async function lessonWorker(){

    pgn = document.getElementById( "pgn-area" ).value;
    url = window.location + "/lesson?name=complexLesson";
    

    try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }

        g_in_lesson_game = true;

        result = await response.text();
        
        obj_Lesson = JSON.parse(result);

        console.log( obj_Lesson.metadata.StartingPosition );
  
    } catch (error) {
        console.error( "Error en lessonWorker:"+ error.message );
    }

    // First lest load de new starting position for the lesson
    resetGamewFEN( obj_Lesson.metadata.StartingPosition );

    // Intro for the lesson
    intro = "This is the <b>" + obj_Lesson.metadata.Title + "</b> lesson by " + obj_Lesson.metadata.Author + "." +
            " " + obj_Lesson.metadata.Description + "<br>" + 
            " Let's go!";
            
    addBotMesage ( intro );

    // Load the lesson moves on the global array / bufffer
    // Not a reference, a copy of the values

    lesson_allowed_moves =  JSON.parse(JSON.stringify( obj_Lesson.move_cases ));
    lesson_tips = JSON.parse(JSON.stringify( obj_Lesson.tips ));
    lesson_nok_chats = JSON.parse(JSON.stringify( obj_Lesson.nok_chats ));

    // Now the status has been passed to the global variables, the game is ON
}

function lessonStep(){

        // TODO: The time machines should be fixed for lessons!

        // But the move could be "wrong" according to the lesson if so
        // we should go back!...and undo the move! Thanks to the time-travel machine!
        document.getElementById('chess-board-timeMachine').style.display = "block";

        // Current PGN on the board
        currentPGN = document.getElementById('pgn-area-moves').value;

        // Lets see all the moves and chat with the user
        its_a_move = false;
        for( i=0; i<lesson_allowed_moves.length; i++ ){

            if( currentPGN.trim() == lesson_allowed_moves[i].pgn.trim() ){

                addBotMesage( lesson_allowed_moves[i].teacher+"" );
                its_a_move = true;
            }
        }

        if (!its_a_move){
            addBotMesage( lesson_nok_chats[0] );
            addBotMesage( lesson_tips[0] );
        }
}
