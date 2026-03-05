// import { useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { API_BASE_URL, API_ENDPOINTS } from "../utils/api-endpoints";
// import { useNavigate } from "react-router-dom";

// export default function VerifyOtpPage() {
//   const [otp, setOtp] = useState("");
//   const navigate = useNavigate();

//   const email = localStorage.getItem("resetEmail");

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await axios.post(
//         API_BASE_URL + API_ENDPOINTS.AUTH.VERIFY_OTP,
//         { email, otp }
//       );

//       toast.success(res.data.message);

//       navigate("/reset-password");
//     } catch (err) {
//       toast.error(err.response?.data?.error || "Invalid OTP");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <form onSubmit={handleSubmit} className="space-y-4 w-80">
//         <h2 className="text-xl font-bold">Verify OTP</h2>

//         <input
//           type="text"
//           placeholder="Enter OTP"
//           className="border p-2 w-full"
//           value={otp}
//           onChange={(e) => setOtp(e.target.value)}
//           required
//         />

//         <button className="bg-green-500 text-white p-2 w-full">
//           Verify OTP
//         </button>
//       </form>
//     </div>
//   );
// }

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL, API_ENDPOINTS } from "../utils/api-endpoints";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Button, Input, LogoIcon } from "../components";

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp) {
      toast.error("Please enter OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        API_BASE_URL + API_ENDPOINTS.AUTH.VERIFY_OTP,
        { email, otp }
      );

      toast.success(res.data.message);

      navigate("/reset-password");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);

      const res = await axios.post(
        API_BASE_URL + API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );

      toast.success(res.data.message || "OTP sent again");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex justify-center items-center">

      {/* Back Button */}
      <button
        onClick={() => navigate("/forgot-password")}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-200 hover:-translate-x-1"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-lg font-medium">Back</span>
      </button>

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="size-14 sm:size-16 bg-linear-to-br from-blue-400 to-blue-500 rounded-full mx-auto mb-3 sm:mb-4 shadow-md flex justify-center items-center">
            <LogoIcon className="size-7 sm:size-8 text-white" />
          </div>

          <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold">
            Verify OTP
          </h1>

          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Enter the OTP sent to your email.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-lg">

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-y-5 sm:gap-y-6"
          >

            <Input
              type="text"
              label="OTP Code"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              placeholder="Enter OTP"
              icon={ShieldCheck}
              maxLength={6}
            />

            <Button
              type="submit"
              isLoading={loading}
              ariaLabel={loading ? "Verifying OTP..." : "Verify OTP"}
              className="w-full"
            >
              Verify OTP
            </Button>

          </form>

          {/* Resend OTP */}
          <p className="text-slate-600 text-center text-xs sm:text-sm mt-6 sm:mt-8">
            Didn't receive OTP?{" "}
            <button
              onClick={handleResendOtp}
              disabled={resending}
              className="text-blue-600 font-medium hover:text-blue-700 hover:underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
          </p>

        </div>
      </div>
    </main>
  );
}