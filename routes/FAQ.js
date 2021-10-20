const router = require("express").Router();

const { userAuth } = require("../utils/Auth");
const { AddFAQ, ShowAllFAQ, ShowFAQ, EditFAQ, DeleteFAQ } = require("../utils/FAQController");

// Show all FAQ (api/FAQ/show)
router.get("/show", userAuth, async (req, res) => {
    await ShowAllFAQ(req.body, res);
});

//Show FAQ (api/FAQ/show/:faq_id)
router.get("/show/:faq_id", userAuth, async (req, res) => {
    const FAQ_id = req.params.faq_id;
    await ShowFAQ(req.body.data, FAQ_id, res);
});
// Add FAQ Route (/api/FAQ/add)
router.post("/add", userAuth, async (req, res) => {
    user_id = req.user
    await AddFAQ(req.body, user_id._id, res);
    // await AddFAQ(req.body, user_id._id, res);
});

// Edit FAQ Route(api/FAQ/edit/faq_id)
router.put("/edit/:faq_id", userAuth, async (req, res) => {
    const FAQ_id = req.params.faq_id;
    await EditFAQ(req.body, FAQ_id, res);
    // await EditFAQ(req.body, FAQ_id, res);
});

// Delete FAQ Route(api/FAQ/edit/faq_id)
router.delete("/delete/:faq_id", userAuth, async (req, res) => {
    const FAQ_id = req.params.faq_id;
    await DeleteFAQ(req.body, FAQ_id, res);
});


module.exports = router;