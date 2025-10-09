# ChachiChess

ChachiChess is a simple, interactive chessboard web application. It displays a chessboard using HTML, CSS Grid, and JavaScript, supports Forsyth–Edwards Notation (FEN) for board setup, and allows users to move pieces via drag-and-drop.

## Features

- Responsive chessboard rendered with CSS Grid
- Board and labels generated dynamically from JavaScript
- Supports custom square size via parameter
- Loads chess positions from FEN strings
- Displays chess pieces using configurable image themes
- Drag-and-drop interface for moving pieces

## Usage

1. Open `chachi.html` in your web browser.
2. The board will display the standard chess starting position.
3. Drag and drop pieces to move them around the board.

## Customization

- Change the initial position by editing the FEN string in the JavaScript (`initialFEN`).
- Change the piece images by modifying the `actualThemePath` variable.
- Adjust the board square size by calling `setChessBoardSize(size)` from the browser console.

## Project Structure

- `chachi.html` - Main HTML file with all logic and styles
- `static/themes/default/pieces/` - Folder for chess piece images

## Credits

- Chess piece images: [Your source or credits here]
- Developed by @danioche

## License

[Specify your license here, e.g., MIT]
