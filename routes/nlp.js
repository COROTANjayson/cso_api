// Testing routes for nlp  can be deleted


const router = require("express").Router();
const { nlpFunction } = require("../utils/nlp/nlp");

// Add Sender Route (/api/sender/add)
router.post("/getresult", /* userAuth, */ async (req, res) => {
    await nlpFunction(req.body, res);
});


module.exports = router;