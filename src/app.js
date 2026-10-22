const express = require('express');
const healthRoutes = require('./routes/health.routes.js');
const app = express();

app.use(express.json())
app.get('/', healthRoutes);

module.exports = app;