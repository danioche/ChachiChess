# Chess Lesson File format Documentation

"#" - Starts a COMMENT  
"#+" - Starts a particular section that will INTERACTION with the system/engine or the user
"#+begin" and "#+end" - An INTERACTION BLOCK that will be used mainly with the user prompting information or giving some additiona info as tips or information to better understanding the lesson. 


## COMMENTS

Comments allowed are for one-line so for every comment line you should start with "#".

## INTERACTION

Avaliable interactions

### Relevant information for the contents of the chess lesson

"#" plus

- +Title 
- +Description
- +Author
- +Language : Language of the file using the 2-code Set1 as per https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes


## INTERACTION BLOCK

Available types of blocks

"#+Begin_" / "#+End_"  plus

- teacher: 

The Teacher is speaking to the user.

- tips:

Tips, a list of tips normally exposing options and opportunities on the current board set.

- move_list:

This is a list with cases that are the movements after players move. Once the player has move the system will check with every case comparing the game play PGN and the expected PGN and the teacher will respond with the prompt indicated just after the PGN.

### Move List block

This is a special block for the lesson, so we can find the following:

- PGN: Will show the specific line that we are or we are expecting
- Teacher: Here the teacher will speack or guide to the user with some recomendations or even tips. When user fails the nok_chats will be prompted to the user.
- Move: Here is the teacher that performs a move when the the PGN position is read from the board.
- New position: Is a FEN new board, that will be loaded once that user reaches the PGN (this opens will reset the counter of the PGN).

## 

### StartingPosition

Interaction with the engine.

This will let the engine know which board should be setted. If not declared the board will be a standard one with starting whites.

### 


## Utils for lessons

FEN viewer - compose:

- https://www.redhotpawn.com/chess/chess-fen-viewer.php
