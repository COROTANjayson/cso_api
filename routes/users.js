const router = require("express").Router();
// Bring in the User Registration function
const {
  userAuth,
  userLogin,
//   checkRole,
  userRegister,
//   serializeUser
} = require("../utils/Auth");

// Users Registeration Route (/api/users/register-user)
router.post("/register-user", userAuth, async (req, res) => {
  await userRegister(req.body, res);
});

// Users Login Route (api/users/login-user)
router.post("/login-user", async (req, res) => {
  await userLogin(req.body, res);
});

// Users Protected Route -dashboard
router.get(
  "/dashboard",
  userAuth,
  async (req, res) => {
      user = req.user;
    return res.json(req.user);
  }
);


// Profile Route
// router.get("/profile", userAuth, async (req, res) => {
//   return res.json(serializeUser(req.user));
// });


// router.get('/logout', function(req, res){
//     req.logout();
//     return res.json('You are now logout');
//   });


module.exports = router;
