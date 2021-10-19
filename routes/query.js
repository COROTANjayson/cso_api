const router = require("express").Router();

const { userAuth } = require("../utils/Auth");
const {
    NewQuery,
    GetAllQueries,
    ShowQuery,
    EditQuery,
    DeleteQuery,
    ShowQueriesByCategory
    // SearchStudent
} = require("../utils/QueryController");

// // Show all query (api/query/show)
router.get("/show", userAuth, async (req, res) => {
    await GetAllQueries(req.body, res);
});

// //Show query (api/query/show/:id) -> OBJECT ID
router.get("/show/:sender_id/:faq_id/:category_id", userAuth, async (req, res) => {
    const send_id = req.params.sender_id
    const faq_id = req.params.faq_id
    const category_id = req.params.category_id
    await ShowQuery(send_id, faq_id, category_id, req.body, res);
});

// Add new query Route (/api/query/add)
// :sender_id/:faq_id/:category_id
router.post("/add/:sender_id/:faq_id/:category_id", userAuth, async (req, res) => {
    const send_id = req.params.sender_id
    const faq_id = req.params.faq_id
    const category_id = req.params.category_id
    await NewQuery(send_id, faq_id, category_id, req.body, res);
});

// // // Edit query Route(api/query/edit/id) -> OBJECT ID
router.put("/edit/:sender_id/:faq_id/:category_id", userAuth, async (req, res) => {
    const send_id = req.params.sender_id
    const faq_id = req.params.faq_id
    const category_id = req.params.category_id
    await EditQuery(send_id, faq_id, category_id, req.body, res);
});

// // Delete query Route(api/query/edit/id)
router.delete("/delete/:sender_id/:faq_id/:category_id", userAuth, async (req, res) => {
    const send_id = req.params.sender_id
    const faq_id = req.params.faq_id
    const category_id = req.params.category_id
    await DeleteQuery(send_id, faq_id, category_id, req.body,res);
});

//Show FAQ ByCategory (api/FAQ/showbycategory/:cat_id)
router.get("/showbycategory/:cat_id", userAuth, async (req, res) => {
    const cat_id = req.params.cat_id;
    await ShowQueriesByCategory(req.body, cat_id, res);
});

//search query (api/query/search/:id) query_id or name
// router.get("/search/:item", userAuth, async (req, res) => {
//     const item = req.params.item;
//     await SearchStudent(req.body, item, res);
// });

module.exports = router;