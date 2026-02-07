# ChachiChess

ChachiChess is a simple, interactive chessboard web application. It displays a chessboard using HTML, CSS Grid, and JavaScript, supports Forsyth–Edwards Notation (FEN) for board setup, and allows users to move pieces via drag-and-drop.

## Features

- Responsive chessboard rendered with CSS Grid
- Board and labels generated dynamically from JavaScript
- Supports custom square size via parameter
- Loads chess positions from FEN strings
- Displays chess pieces using configurable image themes
- Drag-and-drop interface for moving pieces
- Sounds added 
- Time Machine to check your movements
- Engine integrated at backend level, integrated with FE/UI

## Usage

1. Open `chachi.html` in your web browser.
2. The board will display the standard chess starting position.
3. Drag and drop pieces to move them around the board.

## Customization

- Change the initial position by editing the FEN string in the JavaScript (`initialFEN`).
- Change the piece images by modifying the `actualThemePath` variable.
- Adjust the board square size by calling `setChessBoardSize(size)` from the browser console.

## Engine Dependency

Bots can play with you using an external engine, in this project the engine that you should have is stockfish engine.
TODO: Update here the version, path and how to test/configure for the project.


## Project Structure

- `chachi.html` - Main HTML file with all logic and styles
- `static/themes/default/pieces/` - Folder for chess piece images
- 

## Lessons Chess file (CHL)

### Inspiration

This is a new type of file that uses some inspiration: based in FEN and PGN to know which are the options, also I use some of ORG type for the file contentes to preserve the spirit of an open file that can be interpreted by a human and also a computer.

Documentation: See /classroom/format.md

## Credits

- Chess piece images: [Your source or credits here]
- Developed by @danioche

## License

All rights to @danioche 

# TODOs, ideas and much more

Currently working on:

- Initial version of chat 
- Lessons and Teacher interaction ( https://docs.chatterbot.us/training/#training )

List of known bugs to work on:

- Sometimes random allowed movements outside the board. Nice :D 

List of things that I will love to add:

- Lessons and Teacher interaction
- Play against bot (mostly done)
- Multi-language support
- Conversations during the game with teachers and avatars 
- Interactivity/Interoperativity online and offline 
    - PGN / FEN export to file
- Analysis (arrows, highlight on squares and more)
- BD creation 

