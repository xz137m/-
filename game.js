const socket = io();

// DOM Elements
const welcomeScreen = document.getElementById('welcome');
const gameRoom = document.getElementById('gameRoom');
const createRoomBtn = document.getElementById('createRoom');
const joinRoomBtn = document.getElementById('joinRoom');
const roomCodeInput = document.getElementById('roomCode');
const roomCodeDisplay = document.getElementById('roomCodeDisplay');
const copyLinkBtn = document.getElementById('copyLink');
const team1Players = document.getElementById('team1Players');
const team2Players = document.getElementById('team2Players');
const categorySelect = document.getElementById('category');
const startGameBtn = document.getElementById('startGame');
const gameArea = document.getElementById('gameArea');
const wordDisplay = document.getElementById('wordDisplay');
const secretWord = document.getElementById('secretWord');
const messages = document.getElementById('messages');
const questionInput = document.getElementById('questionInput');
const sendQuestionBtn = document.getElementById('sendQuestion');

let currentRoom = null;
let isHost = false;

// Create Room
createRoomBtn.addEventListener('click', () => {
    socket.emit('createRoom');
});

// Join Room
joinRoomBtn.addEventListener('click', () => {
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    if (roomCode) {
        socket.emit('joinRoom', roomCode);
    }
});

// Copy Room Link
copyLinkBtn.addEventListener('click', () => {
    const roomLink = `${window.location.origin}?room=${currentRoom}`;
    navigator.clipboard.writeText(roomLink).then(() => {
        alert('تم نسخ رابط الغرفة!');
    });
});

// Team Selection
document.querySelectorAll('.join-team').forEach(button => {
    button.addEventListener('click', (e) => {
        const team = e.target.dataset.team;
        socket.emit('selectTeam', { roomCode: currentRoom, team });
    });
});

// Category Selection
categorySelect.addEventListener('change', () => {
    if (isHost && categorySelect.value) {
        socket.emit('selectCategory', {
            roomCode: currentRoom,
            category: categorySelect.value
        });
    }
});

// Start Game
startGameBtn.addEventListener('click', () => {
    if (isHost) {
        socket.emit('startGame', currentRoom);
    }
});

// Send Question/Answer
sendQuestionBtn.addEventListener('click', () => {
    const text = questionInput.value.trim();
    if (text && currentRoom) {
        socket.emit('askQuestion', {
            roomCode: currentRoom,
            question: text
        });
        questionInput.value = '';
    }
});

// Quick Answer Buttons
document.querySelectorAll('.answer-btn').forEach(button => {
    button.addEventListener('click', () => {
        const answer = button.dataset.answer;
        socket.emit('sendAnswer', {
            roomCode: currentRoom,
            answer
        });
    });
});

// Socket Events
socket.on('roomCreated', (roomCode) => {
    currentRoom = roomCode;
    isHost = true;
    welcomeScreen.classList.add('hidden');
    gameRoom.classList.remove('hidden');
    roomCodeDisplay.textContent = roomCode;
    startGameBtn.classList.remove('hidden');
});

socket.on('joinedRoom', (roomCode) => {
    currentRoom = roomCode;
    welcomeScreen.classList.add('hidden');
    gameRoom.classList.remove('hidden');
    roomCodeDisplay.textContent = roomCode;
});

socket.on('teamUpdate', (teams) => {
    team1Players.innerHTML = '';
    team2Players.innerHTML = '';
    
    teams.team1.forEach(playerId => {
        const div = document.createElement('div');
        div.textContent = `لاعب ${playerId.substr(0, 4)}`;
        team1Players.appendChild(div);
    });

    teams.team2.forEach(playerId => {
        const div = document.createElement('div');
        div.textContent = `لاعب ${playerId.substr(0, 4)}`;
        team2Players.appendChild(div);
    });
});

socket.on('categorySelected', (category) => {
    categorySelect.value = category;
    if (isHost) {
        startGameBtn.disabled = false;
    }
});

socket.on('gameStarted', () => {
    gameArea.classList.remove('hidden');
});

socket.on('wordAssigned', (word) => {
    wordDisplay.classList.remove('hidden');
    secretWord.textContent = word;
});

socket.on('newQuestion', ({ from, question }) => {
    const div = document.createElement('div');
    div.className = 'message question';
    div.textContent = question;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});

socket.on('newAnswer', ({ from, answer }) => {
    const div = document.createElement('div');
    div.className = 'message answer';
    div.textContent = answer;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
});

// Check URL for room code
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room');
    if (roomCode) {
        roomCodeInput.value = roomCode;
        joinRoomBtn.click();
    }
});
