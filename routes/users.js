const router = require("express").Router();
// Bring in the User Registration function
const {
  userAuth,
  userLogin,
  editUser,
  userRegister,
  serializeUser,
  getAllUsers,
  getUser
} = require("../utils/Auth");

// Users Registeration Route (/api/users/register-user)
router.post("/register-user", userAuth, async (req, res) => {
  await userRegister(req.body, res);
});

// Users Login Route (api/users/login-user)
router.post("/login-user", async (req, res) => {
  await userLogin(req.body, res);
});

// Users Login Route (api/users/edit)
router.post("/edit/:id", userAuth, async (req, res) => {
  const id = req.params.id;
  await editUser(req.body,id, res);
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

module.exports = router;
