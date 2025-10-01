document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const statusElement = document.getElementById('status');
    const restartButton = document.getElementById('restart');
    const startButton = document.getElementById('startButton');
    const hoodElement = document.getElementById('hood');
    const gameContainer = document.getElementById('gameContainer');
    
    let board = [];
    let currentPlayer = 1; // 1 = Jugador (blanco), 2 = Máquina (negro)
    let selectedPiece = null;
    let validMoves = [];
    let mustCapture = false;
    let gameOver = false;
    let aiMustContinueCapture = false;
    let aiSelectedPiece = null;
    let aiValidMoves = [];
    
    // Inicializar el tablero
    function initializeBoard() {
        board = [];
        for (let row = 0; row < 8; row++) {
            board[row] = [];
            for (let col = 0; col < 8; col++) {
                // Solo las casillas oscuras pueden tener fichas
                if ((row + col) % 2 === 1) {
                    if (row < 3) {
                        board[row][col] = { player: 2, isKing: false };
                    } else if (row > 4) {
                        board[row][col] = { player: 1, isKing: false };
                    } else {
                        board[row][col] = null;
                    }
                } else {
                    board[row][col] = null;
                }
            }
        }
    }
    
    // Dibujar el tablero
    function renderBoard() {
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // Marcar movimientos válidos
                if (validMoves.some(move => move.row === row && move.col === col)) {
                    cell.classList.add('valid-move');
                }
                
                // Añadir pieza si existe
                const piece = board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece player${piece.player}`;
                    if (piece.isKing) {
                        pieceElement.classList.add('king');
                    }
                    
                    // Marcar pieza seleccionada
                    if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                        pieceElement.classList.add('selected');
                    }
                    
                    cell.appendChild(pieceElement);
                }
                
                // Solo permitir clics en el turno del jugador
                if (currentPlayer === 1) {
                    cell.addEventListener('click', () => handleCellClick(row, col));
                }
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    // Manejar clic en una celda
    function handleCellClick(row, col) {
        if (gameOver || currentPlayer !== 1) return;
        
        const piece = board[row][col];
        
        // Si hay una pieza del jugador actual, seleccionarla
        if (piece && piece.player === currentPlayer) {
            // Si hay capturas obligatorias, solo permitir seleccionar piezas que puedan capturar
            if (mustCapture) {
                const captures = getValidCaptures(row, col);
                if (captures.length > 0) {
                    selectedPiece = { row, col };
                    validMoves = captures;
                    renderBoard();
                }
            } else {
                selectedPiece = { row, col };
                validMoves = getValidMoves(row, col);
                renderBoard();
            }
        }
        // Si la celda es un movimiento válido, mover la pieza
        else if (selectedPiece && validMoves.some(move => move.row === row && move.col === col)) {
            movePiece(selectedPiece.row, selectedPiece.col, row, col);
            
            // Si el juego no ha terminado, es turno de la máquina
            if (!gameOver && currentPlayer === 2) {
                setTimeout(makeAIMove, 500); // Pequeña pausa para que se vea el movimiento del jugador
            }
        }
    }
    
    // Obtener movimientos válidos para una pieza
    function getValidMoves(row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const moves = [];
        const directions = piece.isKing ? 
            [{r: -1, c: -1}, {r: -1, c: 1}, {r: 1, c: -1}, {r: 1, c: 1}] : 
            (piece.player === 1 ? [{r: -1, c: -1}, {r: -1, c: 1}] : [{r: 1, c: -1}, {r: 1, c: 1}]);
        
        for (const dir of directions) {
            const newRow = row + dir.r;
            const newCol = col + dir.c;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && board[newRow][newCol] === null) {
                moves.push({ row: newRow, col: newCol, capture: null });
            }
        }
        
        return moves;
    }
    
    // Obtener capturas válidas para una pieza
    function getValidCaptures(row, col) {
        const piece = board[row][col];
        if (!piece) return [];
        
        const captures = [];
        const directions = piece.isKing ? 
            [{r: -1, c: -1}, {r: -1, c: 1}, {r: 1, c: -1}, {r: 1, c: 1}] : 
            (piece.player === 1 ? [{r: -1, c: -1}, {r: -1, c: 1}] : [{r: 1, c: -1}, {r: 1, c: 1}]);
        
        for (const dir of directions) {
            const jumpRow = row + dir.r;
            const jumpCol = col + dir.c;
            const landRow = row + 2 * dir.r;
            const landCol = col + 2 * dir.c;
            
            if (landRow >= 0 && landRow < 8 && landCol >= 0 && landCol < 8) {
                const jumpedPiece = board[jumpRow][jumpCol];
                if (jumpedPiece && jumpedPiece.player !== piece.player && board[landRow][landCol] === null) {
                    captures.push({ 
                        row: landRow, 
                        col: landCol, 
                        capture: { row: jumpRow, col: jumpCol }
                    });
                }
            }
        }
        
        return captures;
    }
    
    // Mover una pieza
    function movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        board[fromRow][fromCol] = null;
        board[toRow][toCol] = piece;
        
        // Verificar si la pieza se convierte en dama
        if (!piece.isKing && ((piece.player === 1 && toRow === 0) || (piece.player === 2 && toRow === 7))) {
            piece.isKing = true;
        }
        
        // Si fue una captura, eliminar la pieza capturada
        const move = validMoves.find(m => m.row === toRow && m.col === toCol);
        if (move && move.capture) {
            board[move.capture.row][move.capture.col] = null;
            
            // Verificar si hay más capturas disponibles con la misma pieza
            const furtherCaptures = getValidCaptures(toRow, toCol);
            if (furtherCaptures.length > 0) {
                // Si es el jugador humano
                if (currentPlayer === 1) {
                    selectedPiece = { row: toRow, col: toCol };
                    validMoves = furtherCaptures;
                    mustCapture = true;
                    renderBoard();
                    updateStatus();
                    return; // No cambiar de turno aún
                } 
                // Si es la IA, preparar para continuar capturando
                else {
                    aiMustContinueCapture = true;
                    aiSelectedPiece = { row: toRow, col: toCol };
                    aiValidMoves = furtherCaptures;
                    renderBoard();
                    updateStatus();
                    
                    // Continuar con la siguiente captura después de una pausa
                    setTimeout(() => {
                        if (aiMustContinueCapture) {
                            makeAIMove();
                        }
                    }, 500);
                    return;
                }
            }
        }
        
        // Cambiar de jugador
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        selectedPiece = null;
        validMoves = [];
        mustCapture = false;
        aiMustContinueCapture = false;
        aiSelectedPiece = null;
        aiValidMoves = [];
        
        // Verificar si hay capturas obligatorias para el siguiente jugador
        checkForForcedCaptures();
        
        renderBoard();
        updateStatus();
        checkGameOver();
    }
    
    // Verificar si hay capturas obligatorias
    function checkForForcedCaptures() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.player === currentPlayer) {
                    const captures = getValidCaptures(row, col);
                    if (captures.length > 0) {
                        mustCapture = true;
                        return;
                    }
                }
            }
        }
    }
    
    // Actualizar el estado del juego
    function updateStatus() {
        if (gameOver) {
            const winner = currentPlayer === 1 ? "¡La Casa Negra gana!" : "¡Felicidades, la Casa Blanca gana!";
            statusElement.textContent = winner;
        } else if (currentPlayer === 1) {
            if (mustCapture) {
                statusElement.textContent = "Turno de la Casa Blanca - ¡Captura obligatoria!";
            } else {
                statusElement.textContent = "Turno de la Casa Blanca";
            }
        } else {
            statusElement.textContent = "Turno de la Casa Negra...";
        }
    }
    
    // Verificar si el juego ha terminado
    function checkGameOver() {
        let player1Pieces = 0;
        let player2Pieces = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    if (piece.player === 1) player1Pieces++;
                    else player2Pieces++;
                }
            }
        }
        
        if (player1Pieces === 0 || player2Pieces === 0) {
            gameOver = true;
            updateStatus();
        }
    }
    
    // Movimiento de la IA
    function makeAIMove() {
        if (gameOver || currentPlayer !== 2) return;
        
        // Si la IA debe continuar con capturas múltiples
        if (aiMustContinueCapture && aiSelectedPiece && aiValidMoves.length > 0) {
            const randomMove = aiValidMoves[Math.floor(Math.random() * aiValidMoves.length)];
            
            // Preparar el movimiento para la función movePiece
            selectedPiece = { row: aiSelectedPiece.row, col: aiSelectedPiece.col };
            validMoves = [{
                row: randomMove.row, 
                col: randomMove.col, 
                capture: randomMove.capture
            }];
            
            // Realizar el movimiento
            movePiece(aiSelectedPiece.row, aiSelectedPiece.col, randomMove.row, randomMove.col);
            return;
        }
        
        let possibleMoves = [];
        
        // Buscar todas las piezas de la máquina
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.player === 2) {
                    // Si hay capturas obligatorias, solo considerar capturas
                    if (mustCapture) {
                        const captures = getValidCaptures(row, col);
                        if (captures.length > 0) {
                            for (const capture of captures) {
                                possibleMoves.push({
                                    from: { row, col },
                                    to: { row: capture.row, col: capture.col },
                                    capture: capture.capture
                                });
                            }
                        }
                    } else {
                        // Considerar movimientos normales
                        const moves = getValidMoves(row, col);
                        for (const move of moves) {
                            possibleMoves.push({
                                from: { row, col },
                                to: { row: move.row, col: move.col },
                                capture: null
                            });
                        }
                        
                        // También considerar capturas si no son obligatorias
                        const captures = getValidCaptures(row, col);
                        for (const capture of captures) {
                            possibleMoves.push({
                                from: { row, col },
                                to: { row: capture.row, col: capture.col },
                                capture: capture.capture
                            });
                        }
                    }
                }
            }
        }
        
        // Si no hay movimientos posibles, el juego termina
        if (possibleMoves.length === 0) {
            gameOver = true;
            updateStatus();
            return;
        }
        
        // Priorizar capturas sobre movimientos normales
        const captureMoves = possibleMoves.filter(move => move.capture);
        if (captureMoves.length > 0) {
            possibleMoves = captureMoves;
        }
        
        // Elegir un movimiento aleatorio
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        // Preparar el movimiento para la función movePiece
        selectedPiece = { row: randomMove.from.row, col: randomMove.from.col };
        validMoves = [{
            row: randomMove.to.row, 
            col: randomMove.to.col, 
            capture: randomMove.capture
        }];
        
        // Realizar el movimiento
        movePiece(randomMove.from.row, randomMove.from.col, randomMove.to.row, randomMove.to.col);
    }
    
    // Reiniciar el juego
    function restartGame() {
        initializeBoard();
        currentPlayer = 1;
        selectedPiece = null;
        validMoves = [];
        mustCapture = false;
        gameOver = false;
        aiMustContinueCapture = false;
        aiSelectedPiece = null;
        aiValidMoves = [];
        renderBoard();
        updateStatus();
    }
    
    // Iniciar el juego (quitar el hood)
    function startGame() {
        hoodElement.classList.add('fade-out');
        setTimeout(() => {
            hoodElement.style.display = 'none';
            gameContainer.style.display = 'flex';
        }, 1000);
    }
    
    // Event listeners
    restartButton.addEventListener('click', restartGame);
    startButton.addEventListener('click', startGame);
    
    // Inicializar el juego
    initializeBoard();
    renderBoard();
    updateStatus();
});