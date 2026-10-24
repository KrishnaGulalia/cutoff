const express = require('express');
const healthRoutes = require('./routes/health.routes.js');
const dbRoutes = require("./routes/db.routes.js");
const app = express();

app.use(express.json())

app.use('/', healthRoutes);
app.use("/api/health", dbRoutes);

module.exports = app;