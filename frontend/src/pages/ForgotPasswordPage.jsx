// import { useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { API_BASE_URL, API_ENDPOINTS } from "../utils/api-endpoints";
// import { useNavigate } from "react-router-dom";

// export default function ForgotPasswordPage() {
//   const [email, setEmail] = useState("");
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await axios.post(
//         API_BASE_URL + API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
//         { email }
//       );

//       toast.success(res.data.message);

//       localStorage.setItem("resetEmail", email);

//       navigate("/verify-otp");
//     } catch (err) {
//       toast.error(err.response?.data?.error || "Something went wrong");
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <form onSubmit={handleSubmit} className="space-y-4 w-80">
//         <h2 className="text-xl font-bold">Forgot Password</h2>

//         <input
//           type="email"
//           placeholder="Enter your email"
//           className="border p-2 w-full"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />

//         <button className="bg-blue-500 text-white p-2 w-full">
//           Send OTP
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
import { ArrowLeft, Mail } from "lucide-react";
import { Button, Input, LogoIcon } from "../components";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await axios.post(
        API_BASE_URL + API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );

      toast.success(res.data.message);

      localStorage.setItem("resetEmail", email);

      navigate("/verify-otp");
    } catch (err) {
      toast.error(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex justify-center items-center">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
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
            Forgot Password
          </h1>

          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Enter your email and we'll send you an OTP to reset your password.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-lg">

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-y-5 sm:gap-y-6"
          >

            <Input
              type="email"
              label="Email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
              icon={Mail}
            />

            <Button
              type="submit"
              isLoading={loading}
              ariaLabel={loading ? "Sending OTP..." : "Send OTP"}
              className="w-full"
            >
              Send OTP
            </Button>

          </form>

        </div>
      </div>
    </main>
  );
}