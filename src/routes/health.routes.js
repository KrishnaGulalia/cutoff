const express = require('express');
const router = express.Router();

router.get('/', (req, res)=>{
    res.json({
        message: "Welcome to CutOff",
        status: "running"
    });
});

module.exports = router