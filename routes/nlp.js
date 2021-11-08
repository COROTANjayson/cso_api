// Testing routes for nlp  can be deleted


const router = require("express").Router();
const { nlpFunctionV2 } = require("../utils/nlp/nlp");

// Add Sender Route (/api/sender/add)
router.post("/getresult", /* userAuth, */ async (req, res) => {
    await nlpFunctionV2(req.body.text, res);
});


module.exports = router;