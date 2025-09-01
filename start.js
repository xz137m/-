// Check if production environment
const isProd = process.env.NODE_ENV === 'production';

// Import dependencies
const server = require('./server.js');

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Access the game at:');
    console.log(`- Local: http://localhost:${PORT}`);
    // إذا عندك دالة getLocalIP() ممكن تتركها أو تحذف السطر الثاني
});

