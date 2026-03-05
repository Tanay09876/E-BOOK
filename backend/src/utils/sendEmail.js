// const nodemailer = require("nodemailer");
// const ENV = require("../configs/env");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: ENV.EMAIL_USER,
//     pass: ENV.EMAIL_PASS,
//   },
// });

// async function sendOTPEmail(email, otp) {
//   await transporter.sendMail({
//     from: ENV.EMAIL_USER,
//     to: email,
//     subject: "Password Reset OTP",
//     html: `
//       <h2>Password Reset Request</h2>
//       <p>Your OTP is:</p>
//       <h1>${otp}</h1>
//       <p>This OTP will expire in 10 minutes.</p>
//     `,
//   });
// }

// module.exports = { sendOTPEmail };

const nodemailer = require("nodemailer");
const ENV = require("../configs/env");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from: `"AI Book Writer" <${ENV.EMAIL_USER}>`,
    to: email,
    subject: "Your Password Reset OTP",
    html: `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
      
      <div style="max-width:500px;margin:auto;background:white;border-radius:10px;padding:30px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <!-- Logo -->
       <img 
      src="https://raw.githubusercontent.com/Tanay09876/Impact-training/main/Untitled%20design%20(3).png"
      alt="E-Book Logo"
      style="width:120px;margin-bottom:20px;"
    />

        <h2 style="color:#1f2937;margin-bottom:10px;">
          Password Reset Request
        </h2>

        <p style="color:#6b7280;font-size:14px;margin-bottom:25px;">
          We received a request to reset your password. Use the OTP below to continue.
        </p>

        <!-- OTP BOX -->
        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          background:#eef2ff;
          color:#4338ca;
          padding:15px;
          border-radius:8px;
          display:inline-block;
          margin-bottom:20px;
        ">
          ${otp}
        </div>

        <p style="color:#6b7280;font-size:14px;margin-bottom:20px;">
          This OTP will expire in <b>10 minutes</b>.
        </p>

        <p style="color:#9ca3af;font-size:13px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>

        <hr style="margin:25px 0;border:none;border-top:1px solid #e5e7eb;" />

        <p style="color:#9ca3af;font-size:12px;">
          © ${new Date().getFullYear()} AI Book Writer. All rights reserved.
        </p>

      </div>

    </div>
    `,
  });
}

module.exports = { sendOTPEmail };