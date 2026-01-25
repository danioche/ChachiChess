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

## 

### StartingPosition

Interaction with the engine.

This will let the engine know which board should be setted. If not declared the board will be a standard one with starting whites.

### 


