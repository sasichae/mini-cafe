const express = require("express");

const router = express.Router();

router.get("/" , (req, res) => {
    // console.log("test");
    res.json({
        message: "Get all Product"
    });
});

module.exports = router;