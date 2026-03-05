// const jwt = require("jsonwebtoken");
// const ENV = require("../configs/env");
// const User = require("../models/User");


// function generateToken(userId) {
//   return jwt.sign({ id: userId }, ENV.JWT_SECRET_KEY, { expiresIn: "7d" });
// }

// async function registerUser(req, res) {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ error: "Required fields are missing!" });
//     }

//     const userExists = await User.findOne({ email });

//     if (userExists) {
//       console.error("Email already registered!");

//       return res.status(400).json({ error: "Registration failed!" });
//     }

//     const user = await User.create({ name, email, password });

//     return res.status(201).json({
//       message: "User registered successfully!",
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//       token: generateToken(user._id),
//     });
//   } catch (error) {
//     console.error("Error registering user:", error);

//     return res.status(500).json({ error: "Internal Server Error!" });
//   }
// }

// async function signInUser(req, res) {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ error: "Required fields are missing!" });
//     }

//     const user = await User.findOne({ email }).select("+password");

//     if (!user || !(await user.passwordsMatch(password))) {
//       return res.status(401).json({ error: "Invalid credentials!" });
//     }

//     return res.status(200).json({
//       message: "User signed in successfully!",
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         avatar: user.avatar,
//       },
//       token: generateToken(user._id),
//     });
//   } catch (error) {
//     console.error("Error signing in user:", error);

//     return res.status(500).json({ error: "Internal Server Error!" });
//   }
// }

// module.exports = { registerUser, signInUser };



const jwt = require("jsonwebtoken");
const ENV = require("../configs/env");
const User = require("../models/User");
const crypto = require("crypto");
const { sendOTPEmail } = require("../utils/sendEmail");

function generateToken(userId) {
  return jwt.sign({ id: userId }, ENV.JWT_SECRET_KEY, { expiresIn: "7d" });
}

async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Required fields are missing!" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      console.error("Email already registered!");

      return res.status(400).json({ error: "Registration failed!" });
    }

    const user = await User.create({ name, email, password });

    return res.status(201).json({
      message: "User registered successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Error registering user:", error);

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}

async function signInUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Required fields are missing!" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.passwordsMatch(password))) {
      return res.status(401).json({ error: "Invalid credentials!" });
    }

    return res.status(200).json({
      message: "User signed in successfully!",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Error signing in user:", error);

    return res.status(500).json({ error: "Internal Server Error!" });
  }
}



async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent to email" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
}

async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    res.json({ message: "OTP verified" });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}


async function resetPassword(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = password;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
module.exports = { registerUser, signInUser ,forgotPassword,verifyOTP,resetPassword };





