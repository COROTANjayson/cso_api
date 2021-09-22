const router = require("express").Router();

const { userAuth } = require("../utils/Auth");
const { AddSender } = require("../utils/SenderController");

// Add Sender Route (/api/sender/add)
router.post("/add", /* userAuth, */ async (req, res) => {
    user_id = req.user
    await AddSender(req.body, res);
});


module.exports = router;