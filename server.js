
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');

// تمكين CORS لجميع الطلبات
app.use(cors());

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Serve static files from public directory
app.use(express.static('public'));

// Add basic route for testing
app.get('/test', (req, res) => {
    res.send('Server is working!');
});

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Game state
const rooms = new Map();
const categories = {
    'أفلام': ['الأب الروحي', 'تيتانيك', 'المصارع', 'العراب'],
    'حيوانات': ['أسد', 'فيل', 'زرافة', 'نمر'],
    'مشاهير': ['محمد صلاح', 'كريستيانو رونالدو', 'ليونيل ميسي'],
    'أماكن': ['برج خليفة', 'برج إيفل', 'الأهرامات', 'تاج محل'],
    'مأكولات': ['كبسة', 'مندي', 'شاورما', 'فلافل']
};

// Room creation and management
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create new room
    socket.on('createRoom', () => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        rooms.set(roomCode, {
            players: new Map([[socket.id, {
                id: socket.id,
                isHost: true,
                team: null,
                word: null
            }]]),
            category: null,
            currentWord: null,
            teams: {
                'team1': [],
                'team2': []
            }
        });
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    // Join room
    socket.on('joinRoom', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room) {
            room.players.set(socket.id, {
                id: socket.id,
                isHost: false,
                team: null,
                word: null
            });
            socket.join(roomCode);
            socket.emit('joinedRoom', roomCode);
            io.to(roomCode).emit('playerList', Array.from(room.players.values()));
        } else {
            socket.emit('error', 'غرفة غير موجودة');
        }
    });

    // Select team
    socket.on('selectTeam', ({ roomCode, team }) => {
        const room = rooms.get(roomCode);
        if (room && room.players.has(socket.id)) {
            const player = room.players.get(socket.id);
            // Remove from old team if exists
            if (player.team) {
                room.teams[player.team] = room.teams[player.team].filter(id => id !== socket.id);
            }
            // Add to new team
            player.team = team;
            room.teams[team].push(socket.id);
            io.to(roomCode).emit('teamUpdate', room.teams);
        }
    });

    // Select category
    socket.on('selectCategory', ({ roomCode, category }) => {
        const room = rooms.get(roomCode);
        if (room && categories[category]) {
            room.category = category;
            io.to(roomCode).emit('categorySelected', category);
        }
    });

    // Start game
    socket.on('startGame', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room) {
            const category = room.category;
            const words = categories[category];
            room.currentWord = words[Math.floor(Math.random() * words.length)];
            socket.emit('wordAssigned', room.currentWord);
            io.to(roomCode).emit('gameStarted');
        }
    });

    // Handle question
    socket.on('askQuestion', ({ roomCode, question }) => {
        io.to(roomCode).emit('newQuestion', {
            from: socket.id,
            question
        });
    });

    // Handle answer
    socket.on('sendAnswer', ({ roomCode, answer }) => {
        io.to(roomCode).emit('newAnswer', {
            from: socket.id,
            answer
        });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        rooms.forEach((room, roomCode) => {
            if (room.players.has(socket.id)) {
                room.players.delete(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(roomCode);
                } else {
                    io.to(roomCode).emit('playerList', Array.from(room.players.values()));
                }
            }
        });
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Access the game at:');
    console.log(`- Local: http://localhost:${PORT}`);
    console.log(`- Network: http://${getLocalIP()}:${PORT}`);
});

function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}
>>>>>>> cdaee52be78e7493df617658d0faa303892ccd24
