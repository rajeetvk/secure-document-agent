require('dotenv').config();
const express = require('express');
const cors = require('cors');

const workspacesRouter = require('./routes/workspaces');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON bodies

app.use('/api/workspaces', workspacesRouter);


// Basic health check route to test if the server is alive
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running correctly!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
