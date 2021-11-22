const router = require("express").Router();
// Bring in the User Registration function
const {
  userAuth,
  userLogin,
  editUser,
  userRegister,
  serializeUser,
  getAllUsers,
  getUser,
  editUserInfo,
  editUserContact,
  editUsername,
  editPassword,
  ShowSystemLog
} = require("../utils/Auth");

// Users Registeration Route (/api/users/register-user)
router.post("/register-user", userAuth, async (req, res) => {
  await userRegister(req.body.data, res);
  // await userRegister(req.body, res);
});

// Users Login Route (api/users/login-user)
router.post("/login-user", async (req, res) => {
  await userLogin(req.body, res);
});

// Users Login Route (api/users/edit)
router.post("/edit/:id", userAuth, async (req, res) => {
  const id = req.params.id;
  await editUser(req.body.data,id, res);
  // await editUser(req.body,id, res);
});

// Users Edit info Route (api/users/edit)
router.post("/editinfo/:id", userAuth, async (req, res) => {
  const id = req.params.id;
  await editUserInfo(req.body.data,id, res);
  // await editUser(req.body,id, res);
});

// Users Edit Contact Route (api/users/edit)
router.post("/editcontact/:id", userAuth, async (req, res) => {
  const id = req.params.id;
  await editUserContact(req.body.data,id, res);
  // await editUser(req.body,id, res);
});

// Users Edit Username Route (api/users/edit)
router.post("/editusername/:id", userAuth, async (req, res) => {
  const id = req.params.id;
  await editUsername(req.body.data,id, res);
  // await editUser(req.body,id, res);
});

// Users Edit Username Route (api/users/edit)
router.post("/editpassword/:id", userAuth, async (req, res) => {
  const id = req.params.id;
  await editPassword(req.body.data,id, res);
  // await editUser(req.body,id, res);
});

// Users Protected Route (api/users/dashboard)
router.get("/dashboard", userAuth, async (req, res) => {
  return res.json(serializeUser(req.user));
});

// // Users Show all Users Route (api/users/show)
router.get("/show", userAuth, async (req, res) => {
  await getAllUsers(req, res);
});

// // Users Show Users Route (api/users/show)
router.get("/show/:id", /* userAuth, */ async (req, res) => {
  const id = req.params.id;
  await getUser(req, id ,res);
});

router.get("/systemlog", /* userAuth, */ async (req, res) => {
  
  await ShowSystemLog(req,res);
});
module.exports = router;
