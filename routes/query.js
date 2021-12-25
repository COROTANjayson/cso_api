const router = require("express").Router();

const { userAuth } = require("../utils/Auth");
const {
    NewQuery,
    GetAllQueries,
    ShowQuery,
    EditQuery,
    DeleteQuery,
    ShowQueriesByCategory,
    ShowUnidentifiedQuery,
    ShowPossibleCategory,
    ChangeQueryCategory,
    ShowUnidentifiedQueryByMonth,
    GetCurrentUnidentifiedQuery,
    GetCurrentQuery
} = require("../utils/QueryController");

// // Show all query (api/query/show)
router.get("/show", userAuth, async (req, res) => {
    await GetAllQueries(req.body, res);
});

// //Show query (api/query/show/:id) -> OBJECT ID
router.get("/show/:id", userAuth, async (req, res) => {
    const query_id = req.params.id
    await ShowQuery(query_id ,req.body, res);
});

// Add new query Route (/api/query/add)
// :sender_id/:faq_id/:category_id
router.post("/add", userAuth, async (req, res) => {
    // await NewQuery(req.body, res);
    await NewQuery(req.body, res);
});

// // // Edit query Route(api/query/edit/id) -> OBJECT ID
router.put("/edit/:id", userAuth, async (req, res) => {
    const query_id = req.params.id
    // await EditQuery(query_id, req.body, res);
    await EditQuery(query_id, req.body.data, res);
    
});

// // Delete query Route(api/query/edit/id)
router.delete("/delete/", userAuth, async (req, res) => {
    await DeleteQuery(req.body,res);
});

//Show FAQ ByCategory (api/FAQ/showbycategory/:cat_id)
router.get("/showbycategory/:cat_id", userAuth, async (req, res) => {
    const cat_id = req.params.cat_id;
    await ShowQueriesByCategory(req.body, cat_id, res);
});

router.get("/unidentifiedquery", userAuth, async (req, res) => {
    await ShowUnidentifiedQuery(req.body, res);
});

router.get("/showpossiblecategory", userAuth, async (req, res) => {
    await ShowPossibleCategory(req.body, res);
});

router.post("/changequerycategory/:id", userAuth, async (req, res) => {
    const query_id = req.params.id
    // await ChangeQueryCategory(query_id, req.body, res);
    await ChangeQueryCategory(query_id, req.body.data, res);
    
});

router.post("/show-unidentified-query-by-month", userAuth, async (req, res) => {
    await ShowUnidentifiedQueryByMonth( req.body.data, res);
    
});

router.post("/get-current-unidentified-query", userAuth, async (req, res) => {
    // console.log(req.body.data);
    await GetCurrentUnidentifiedQuery( req.body.data, res);
    
});


router.post("/get-current-query", userAuth, async (req, res) => {
    // console.log(req.body.data);
    await GetCurrentQuery( req.body.data, res);
    
});



//search query (api/query/search/:id) query_id or name
// router.get("/search/:item", userAuth, async (req, res) => {
//     const item = req.params.item;
//     await SearchStudent(req.body, item, res);
// });

module.exports = router;