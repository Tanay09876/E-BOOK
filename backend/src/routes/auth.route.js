const router = require("express").Router();
const { registerUser, signInUser,forgotPassword,verifyOTP, resetPassword,} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", signInUser);

router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);


module.exports = router;
