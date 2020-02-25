var boardData = null
var rows = 0
var cols = 0
var mines = 0
var clickedSquares = []
var flags = []
var playing = false


function getBoardData() {
    //The URL to which we will send the request
    var url = 'https://veff213-minesweeper.herokuapp.com/api/v1/minesweeper';

    var input_rows = document.getElementById("rows").value
    var input_cols = document.getElementById("cols").value
    var input_mines = document.getElementById("mines").value
    // Set defaults if inputs are invalid
    if (!input_rows || input_rows < 1 || input_rows > 40) input_rows = 10
    if (!input_cols || input_cols < 1 || input_cols > 40) input_cols = 10
    if (!input_mines || input_mines < 0 || input_mines > input_rows*input_cols) input_mines = 10
    axios.post(url, {rows: input_rows, cols: input_cols, mines: input_mines})
        .then(function (response) {
            //When successful, print 'Success: ' and the received data
            createBoard(response.data.board)
            rows = input_rows
            cols = input_cols
            mines = input_mines
        })
        .catch(function (error) {
            //When unsuccessful, show the default board and print the error.
            createBoard(defaultBoard())
            rows = 10
            cols = 10
            mines = 10
            console.log(error);
        })
}


function createBoard(data) {
    board = []
    boardData = data
    clickedSquares = []
    flags = []
    clearBoard()
    document.getElementById("message").innerHTML = ""
    playing = true
    var table = document.getElementById("board")
    squareCount = 0

    // Generate the board in html
    for (let y = 0; y < data.rows; y++) {
        var tr = document.createElement("tr")
        for (let x = 0; x < data.cols; x++) {
            var td = document.createElement("td")
            var square_div = document.createElement("div")
            square_div.setAttribute("class", "square")
            square_div.setAttribute("id", squareCount)
            square_div.onclick = function(e) {
                // handle leftclick
                if (playing) {
                    var squareCords = getSquareCords(this.id)
                    if (checkForMine(squareCords)) {
                        showAllMines()
                    } else {
                        countCloseMines(squareCords)
                    }
                    checkWinner()
                }
            }
            square_div.oncontextmenu = function() {
                // handle rightclick
                if (playing) {
                    setFlag(this)
                    checkWinner()
                    return false;
                }
            }
            td.appendChild(square_div)
            tr.appendChild(td)
            squareCount++;
        }
        table.appendChild(tr)
    }
}

function defaultBoard() {
    // If the backend is not reachable
    default_minePositions = [[1,3], [3,0], [4,2], [4,5], [4,7], [6,9], [7,7], [8,9], [9,3], [9,9]]
    default_rows = 10
    default_cols = 10
    default_mines = 10
    data = {minePositions: default_minePositions, rows: default_rows, cols: default_cols, mines: default_mines}
    return data

}

function clearBoard() {
    document.getElementById("board").innerHTML = ''
}

function getSquareCords(pos) {
    // param is nr of square, returns cords for that square
    var row = Math.floor(pos / cols);
    var col = pos % cols;
    return [row, col]
}

function getSquareObj(cords) {
    // takes in cords for a square and returns the square object
    return document.getElementById(cords[0]*(cols) + cords[1])
}

function checkForMine(cords) {
    for (const mine in boardData.minePositions) {
        if (boardData.minePositions[mine][0] == cords[0] && boardData.minePositions[mine][1] == cords[1]) {
            return true
        }
    }
    return false
}

function countCloseMines(cords) {
    // takes in cords and returns amount of neighbour mines
    // if the neighbour squares have no neighbour mines, run recursively for those squares aswell
    close_mines = 0
    if (cords[0] < 0 || cords[0] > rows-1 || cords[1] < 0 || cords[1] > cols-1) return // return if square is out of board
    if (clickedSquares.includes(getSquareObj(cords).id)) return // return if square is already clicked
    clickedSquares.push(getSquareObj(cords).id)
    var obj = getSquareObj(cords)

    for (const mine in boardData.minePositions) {
        current_mine = boardData.minePositions[mine]
        
        // count neighbour mines
        if (current_mine[0] == cords[0]-1 && current_mine[1] == cords[1]) {
            close_mines++
        }
        if (current_mine[0] == cords[0]+1 && current_mine[1] == cords[1]) {
            close_mines++
        }
        if (current_mine[0] == cords[0] && current_mine[1] == cords[1]-1) {
            close_mines++
        }
        if (current_mine[0] == cords[0] && current_mine[1] == cords[1]+1) {
            close_mines++
        }
        if (current_mine[0] == cords[0]-1 && current_mine[1] == cords[1]-1) {
            close_mines++
        }
        if (current_mine[0] == cords[0]-1 && current_mine[1] == cords[1]+1) {
            close_mines++
        }
        if (current_mine[0] == cords[0]+1 && current_mine[1] == cords[1]-1) {
            close_mines++
        }
        if (current_mine[0] == cords[0]+1 && current_mine[1] == cords[1]+1) {
            close_mines++
        }
    }
    if (close_mines > 0) {
        clickedEmpty(obj)
        if (close_mines == 1) {
            obj.style.color = "blue"
        }
        else if (close_mines == 2) {
            obj.style.color = "#14ac14" //Green
        }
        else {
            obj.style.color = "red"
        }
        obj.innerHTML = close_mines
    } else {
        countCloseMines([cords[0]-1, cords[1]])
        countCloseMines([cords[0]+1, cords[1]])
        countCloseMines([cords[0], cords[1]-1])
        countCloseMines([cords[0], cords[1]+1])
        countCloseMines([cords[0]-1, cords[1]+1])
        countCloseMines([cords[0]+1, cords[1]-1])
        countCloseMines([cords[0]-1, cords[1]-1])
        countCloseMines([cords[0]+1, cords[1]+1])
        clickedEmpty(obj)
    }
}

function clickedMine(obj) {
    // adds mine image to square, styles the square correctly and creates a losing message
    var elem = document.createElement("img")
    elem.src = "img/bomb.png"
    obj.innerHTML = ""
    obj.appendChild(elem)
    obj.style.backgroundColor = "#FA8072";
    obj.classList.remove("flag");
    if (flags.includes(obj.id)) {
        flags.splice(flags.indexOf(obj.id), 1)
    }
    document.getElementById("message").innerHTML = "<b>You hit a mine and lost :(</b><br>click generate to play again"
    playing = false
}

function clickedEmpty(obj) {
    // changes square style to clicked style
    obj.style.boxShadow = "none"
    obj.style.backgroundColor = "#cecece"
    obj.classList.add("clicked")
    obj.classList.remove("flag");
    if (flags.includes(obj.id)) {
        flags.splice(flags.indexOf(obj.id), 1)
    }
}

function showAllMines() {
    // shows all mines on the board
    for (const mine in boardData.minePositions) {
        current_mine = boardData.minePositions[mine]
        clickedMine(getSquareObj(current_mine))
    }
}

function setFlag(obj) {
    // sets a flag on the obj square if it hasn't been clicked already
    if (!obj.classList.contains("clicked")) {
        obj.classList.toggle("flag")
        if (flags.includes(obj.id)) {
            flags.splice(flags.indexOf(obj.id), 1)
        } else {
            flags.push(obj.id)
        }
    }
}

function checkWinner() {
    // Checks if the player has won and reveals a winning message if the player has won
    if (clickedSquares.length == (rows*cols)-mines) {
        if (flags.length == mines){
            document.getElementById("message").innerHTML = "<b>We have a winner!!!</b><br>click generate to play again"
            greenSquares = document.getElementsByClassName("clicked")
            for (i = 0; i < greenSquares.length; i++) {
                greenSquares[i].classList.add("green-background")
            }
            playing = false
        }
    }
}