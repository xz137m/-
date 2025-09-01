// Check if production environment
const isProd = process.env.NODE_ENV === 'production';

// Import the main server file
require('./server.js');
