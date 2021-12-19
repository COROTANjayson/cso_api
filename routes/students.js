const router = require("express").Router();

const { userAuth } = require("../utils/Auth");
const {
    AddStudent,
    ShowAllStudent,
    ShowStudent,
    EditStudent,
    DeleteStudent,
    GetAllInquirerRecords,
    GetInquirerRecords,
    SelectBroadcast,
    FilterStudentRecords
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

router.get("/showinquirer", userAuth, async (req, res) => {
    await GetAllInquirerRecords(req.body, res);
});

router.get("/showinquirer/:id", userAuth, async (req, res) => {
    const id = req.params.id;
    await GetInquirerRecords(req.body, id, res);
});

router.post("/broadcast", userAuth, async (req, res) => {
    // await SelectBroadcast(req.body, res);
    await SelectBroadcast(req.body.data, res);
});

router.post("/filterstudentrecords", userAuth, async (req, res) => {
    // await SelectBroadcast(req.body, res);
    await FilterStudentRecords(req.body.data, res);
});

module.exports = router;