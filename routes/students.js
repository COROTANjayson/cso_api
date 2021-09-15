const router = require("express").Router();

const { userAuth } = require("../utils/Auth");
const {
    AddStudent,
    ShowAllStudent,
    ShowStudent,
    EditStudent,
    DeleteStudent,
    SearchStudent
} = require("../utils/StudentsController");

// Show all student (api/students/show)
router.get("/show", userAuth, async (req, res) => {
    await ShowAllStudent(req.body, res);
});

//Show student (api/students/show/:id) -> OBJECT ID
router.get("/show/:id", userAuth, async (req, res) => {
    const id = req.params.id;
    await ShowStudent(req.body, id, res);
});

// Add student Route (/api/students/add)
router.post("/add", userAuth, async (req, res) => {
    await AddStudent(req.body, res);
});

// // Edit student Route(api/students/edit/id) -> OBJECT ID
router.put("/edit/:id", userAuth, async (req, res) => {
    const id = req.params.id;
    await EditStudent(req.body, id, res);
});

// Delete student Route(api/students/edit/id)
router.delete("/delete/:id", userAuth, async (req, res) => {
    const id = req.params.id;
    await DeleteStudent(req.body, id, res);
});

//search student (api/student/search/:id) student_id or name
// router.get("/search/:item", userAuth, async (req, res) => {
//     const item = req.params.item;
//     await SearchStudent(req.body, item, res);
// });

module.exports = router;