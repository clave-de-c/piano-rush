// script.js

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const bodyElement = document.body;
    const gameContainer = document.getElementById('game-container');
    const pianoKeyboard = document.getElementById('piano-keyboard');
    const noteTrack = document.getElementById('note-track');
    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');
    const levelDisplay = document.getElementById('level');
    const specialBar = document.getElementById('special-bar');
    const levelUpAlert = document.getElementById('level-up-alert');
    const startGameOverScreen = document.getElementById('start-game-over-screen');
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const scoreInputContainer = document.getElementById('score-input-container');
    const finalScoreDisplay = document.getElementById('final-score');
    const playerNameInput = document.getElementById('player-name');
    const modeSelectionContainer = document.getElementById('mode-selection-container');
    const startNormalButton = document.getElementById('start-normal-button');
    const startChallengeButton = document.getElementById('start-challenge-button');
    const saveScoreButton = document.getElementById('save-score-button');
    const leaderboardModal = document.getElementById('leaderboard-modal');
    const showLeaderboardBtn = document.getElementById('show-leaderboard-btn');
    const closeLeaderboardBtn = leaderboardModal.querySelector('.close-btn');
    const quitButton = document.getElementById('quit-button');

    // --- DADOS E ESTADO DO JOGO ---
    const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const sharpNotes = ['Cs', 'Ds', 'Fs', 'Gs', 'As'];
    const noteNames = { C: 'DÓ', D: 'RÉ', E: 'MI', F: 'FÁ', G: 'SOL', A: 'LÁ', B: 'SI', Cs: 'DÓ♯', Ds: 'RÉ♯', Fs: 'FÁ♯', Gs: 'SOL♯', As: 'LÁ♯' };
    const noteSoundFiles = { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si', Cs: 'dos', Ds: 'res', Fs: 'fas', Gs: 'sols', As: 'las' };
    const levelSpeeds = { 1: 5.0, 2: 4.0, 3: 3.2, 4: 2.5, 5: 2.0, 6: 1.7, 7: 1.5, 8: 1.2 };
    const hitsPerLevel = 10;
    
    let currentNoteSet = [];
    let level, score, lives, noteSpeed, currentNote, gameIsOver;
    let correctHitsInRow = 0;
    let specialMeter = 0, comboActive = false, comboTimeout;

    // --- LÓGICA DO JOGO ---
    function showStartScreen() {
        gameIsOver = true;
        noteTrack.innerHTML = '';
        modalTitle.textContent = "Piano Rush";
        modalText.textContent = "Escolha seu modo de jogo para começar!";
        scoreInputContainer.classList.add('hidden');
        saveScoreButton.classList.add('hidden');
        modeSelectionContainer.classList.remove('hidden');
        startGameOverScreen.classList.add('show');
        resetCombo();
    }

    function startGame(mode) {
        currentNoteSet = (mode === 'challenge') ? [...naturalNotes, ...sharpNotes] : [...naturalNotes];
        score = 0; lives = 3; level = 1; correctHitsInRow = 0; specialMeter = 0;
        noteSpeed = levelSpeeds[level];
        gameIsOver = false;
        updateHUD();
        startGameOverScreen.classList.remove('show');
        spawnNewNote();
    }

    function spawnNewNote() {
        if (gameIsOver) return;
        noteTrack.innerHTML = '';
        currentNote = currentNoteSet[Math.floor(Math.random() * currentNoteSet.length)];
        
        const noteBlock = document.createElement('div');
        noteBlock.className = 'note-block';
        noteBlock.textContent = noteNames[currentNote];
        if (sharpNotes.includes(currentNote)) {
            noteBlock.style.backgroundColor = 'var(--challenge-color)';
        }
        noteBlock.style.animationName = 'none'; void noteBlock.offsetWidth;
        noteBlock.style.animationName = 'slide-in';
        noteBlock.style.animationDuration = `${noteSpeed}s`;
        noteBlock.addEventListener('animationend', handleMiss);
        noteTrack.appendChild(noteBlock);
    }

    function handleKeyPress(pressedNote) {
        if (gameIsOver || !currentNote) return;
        
        if (pressedNote === currentNote) {
            correctHitsInRow++;
            score += comboActive ? 20 : 10;
            if (!comboActive) {
                specialMeter += sharpNotes.includes(pressedNote) ? 25 : 5;
                if (specialMeter >= 100) {
                    activateCombo();
                    specialMeter = 100;
                }
            }
            updateHUD();
            const noteBlock = noteTrack.querySelector('.note-block');
            if (noteBlock) noteBlock.remove();
            currentNote = null;
            flashFeedback(pressedNote, true);
            new Audio('sounds/success.mp3').play();
            if (correctHitsInRow > 0 && correctHitsInRow % hitsPerLevel === 0) {
                levelUp();
            }
            setTimeout(spawnNewNote, 400);
        } else {
            lives--;
            resetCombo();
            flashFeedback(pressedNote, false);
            new Audio('sounds/miss.mp3').play();
            if (lives <= 0) endGame();
            updateHUD();
        }
    }
    
    function handleMiss(event) {
        if (!event.target.parentNode || gameIsOver) return;
        lives--;
        resetCombo();
        noteTrack.innerHTML = ''; currentNote = null;
        new Audio('sounds/miss.mp3').play();
        if (lives <= 0) endGame();
        else setTimeout(spawnNewNote, 400);
        updateHUD();
    }

    function activateCombo() {
        comboActive = true;
        updateComboState(true);
        comboTimeout = setTimeout(resetCombo, 7000);
    }
    
    function resetCombo() {
        clearTimeout(comboTimeout);
        comboActive = false;
        specialMeter = 0;
        correctHitsInRow = 0;
        updateHUD();
    }

    function levelUp() {
        if (level < Object.keys(levelSpeeds).length) {
            level++;
            noteSpeed = levelSpeeds[level];
            levelUpAlert.classList.remove('hidden');
            setTimeout(() => { levelUpAlert.classList.add('hidden'); }, 1500);
        }
    }

    function endGame() {
        gameIsOver = true;
        resetCombo();
        noteTrack.innerHTML = '';
        modalTitle.textContent = "Fim de Jogo!";
        modalText.textContent = "Sua pontuação final foi:";
        scoreInputContainer.classList.remove('hidden');
        finalScoreDisplay.textContent = score;
        modeSelectionContainer.classList.add('hidden');
        saveScoreButton.classList.remove('hidden');
        startGameOverScreen.classList.add('show');
    }

    function saveScore() {
        const playerName = playerNameInput.value.trim() || 'Anônimo';
        const scores = JSON.parse(localStorage.getItem('pianoRushScores')) || [];
        scores.push({ name: playerName, score: score });
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('pianoRushScores', JSON.stringify(scores.slice(0, 10)));
        startGameOverScreen.classList.remove('show');
        displayLeaderboard();
    }
    
    function displayLeaderboard() {
        const listElement = leaderboardModal.querySelector('#leaderboard-list');
        const scores = JSON.parse(localStorage.getItem('pianoRushScores')) || [];
        listElement.innerHTML = '';
        if (scores.length === 0) {
            listElement.innerHTML = '<li>Ainda não há pontuações. Jogue para entrar no ranking!</li>';
        } else {
            scores.forEach((s, index) => {
                const rank = index + 1;
                let rankDisplay;
                if (rank === 1) rankDisplay = '🥇';
                else if (rank === 2) rankDisplay = '🥈';
                else if (rank === 3) rankDisplay = '🥉';
                else rankDisplay = `${rank}º`;
                const li = document.createElement('li');
                li.innerHTML = `<div class="player-info"><span class="player-rank">${rankDisplay}</span><span class="player-name">${s.name}</span></div><span class="score-details">${s.score} Pontos</span>`;
                listElement.appendChild(li);
            });
        }
        leaderboardModal.classList.add('show');
    }

    function updateHUD() {
        scoreDisplay.textContent = score;
        levelDisplay.textContent = level;
        specialBar.style.width = `${specialMeter}%`;
        livesDisplay.innerHTML = '<span>♥</span>'.repeat(lives);
        updateComboState(comboActive);
    }

    function updateComboState(isActive) {
        bodyElement.classList.toggle('combo-active', isActive);
        gameContainer.classList.toggle('combo-active', isActive);
    }

    function flashFeedback(note, isCorrect) {
        const keyElement = pianoKeyboard.querySelector(`[data-note="${note}"]`);
        const flashClass = isCorrect ? 'correct-flash' : 'wrong-flash';
        keyElement.classList.add(flashClass);
        setTimeout(() => { keyElement.classList.remove(flashClass); }, 300);
    }
    
    function createKeyboard() {
        pianoKeyboard.innerHTML = '';
        naturalNotes.forEach(note => {
            const key = document.createElement('div');
            key.className = 'key white';
            key.dataset.note = note;
            addKeyInteraction(key, note);
            pianoKeyboard.appendChild(key);
        });
        sharpNotes.forEach(note => {
            const key = document.createElement('div');
            key.className = 'key black';
            key.dataset.note = note;
            addKeyInteraction(key, note);
            pianoKeyboard.appendChild(key);
        });
    }

    function addKeyInteraction(keyElement, note) {
        const handleInteraction = (e) => {
            e.preventDefault();
            e.stopPropagation();
            new Audio(`sounds/${noteSoundFiles[note]}.mp3`).play().catch(err => {});
            handleKeyPress(note);
        };
        keyElement.addEventListener('mousedown', handleInteraction);
        keyElement.addEventListener('touchstart', handleInteraction);
    }

    startNormalButton.addEventListener('click', () => startGame('normal'));
    startChallengeButton.addEventListener('click', () => startGame('challenge'));
    saveScoreButton.addEventListener('click', saveScore);
    quitButton.addEventListener('click', () => { if (!gameIsOver) showStartScreen(); });
    showLeaderboardBtn.addEventListener('click', displayLeaderboard);
    
    const closeLeaderboardAction = () => {
        leaderboardModal.classList.remove('show');
        showStartScreen();
    };
    closeLeaderboardBtn.addEventListener('click', closeLeaderboardAction);
    window.addEventListener('click', (event) => { 
        if (event.target == leaderboardModal) closeLeaderboardAction(); 
    });

    createKeyboard();
    showStartScreen();
});