const router = require("express").Router();

const { userAuth } = require("../utils/Auth");
const { AddCategory, ShowAllCategory, ShowCategory, EditCategory, DeleteCategory } = require("../utils/CategoryController");

// Show all Category (api/category/show)
router.get("/show", userAuth, async (req, res) => {
    await ShowAllCategory(req.body, res);
});

//Show Category (api/category/show/:cat_id)
router.get("/show/:cat_id", userAuth, async (req, res) => {
    const cat_id = req.params.cat_id;
    await ShowCategory(req.body, cat_id, res);
});
// Add Category Route (/api/category/add)
router.post("/add", userAuth, async (req, res) => {
    user_id = req.user
    await AddCategory(req.body, user_id._id, res);
});

// Edit Category Route(api/category/edit/cat_id)
router.put("/edit/:cat_id", userAuth, async (req, res) => {
    const cat_id = req.params.cat_id;
    await EditCategory(req.body, cat_id, res);
});

// Delete Category Route(api/category/edit/cat_id)
router.delete("/delete/:cat_id", userAuth, async (req, res) => {
    const cat_id = req.params.cat_id;
    await DeleteCategory(req.body, cat_id, res);
});

module.exports = router;