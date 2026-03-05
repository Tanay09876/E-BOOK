// import { useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { API_BASE_URL, API_ENDPOINTS } from "../utils/api-endpoints";
// import { useNavigate } from "react-router-dom";

// export default function ResetPasswordPage() {
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const email = localStorage.getItem("resetEmail");

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!email) {
//       toast.error("Session expired. Please start again.");
//       navigate("/forgot-password");
//       return;
//     }

//     if (password !== confirmPassword) {
//       toast.error("Passwords do not match");
//       return;
//     }

//     if (password.length < 8) {
//       toast.error("Password must be at least 8 characters");
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await axios.post(
//         API_BASE_URL + API_ENDPOINTS.AUTH.RESET_PASSWORD,
//         {
//           email,
//           password,
//         }
//       );

//       toast.success(res.data.message || "Password reset successful");

//       localStorage.removeItem("resetEmail");

//       navigate("/login");
//     } catch (err) {
//       console.error(err);
//       toast.error(err.response?.data?.error || "Reset failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center">
//       <form
//         onSubmit={handleSubmit}
//         className="space-y-4 w-80 bg-white p-6 rounded shadow"
//       >
//         <h2 className="text-xl font-bold text-center">
//           Reset Password
//         </h2>

//         <input
//           type="password"
//           placeholder="New Password"
//           className="border p-2 w-full rounded"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />

//         <input
//           type="password"
//           placeholder="Confirm Password"
//           className="border p-2 w-full rounded"
//           value={confirmPassword}
//           onChange={(e) => setConfirmPassword(e.target.value)}
//           required
//         />

//         <button
//           disabled={loading}
//           className="bg-purple-500 text-white p-2 w-full rounded hover:bg-purple-600 disabled:opacity-50"
//         >
//           {loading ? "Resetting..." : "Reset Password"}
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
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Button, Input, LogoIcon } from "../components";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Session expired. Please start again.");
      navigate("/forgot-password");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        API_BASE_URL + API_ENDPOINTS.AUTH.RESET_PASSWORD,
        {
          email,
          password: formData.password,
        }
      );

      toast.success(res.data.message || "Password reset successful");

      localStorage.removeItem("resetEmail");

      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex justify-center items-center">

      {/* Back Button */}
      <button
        onClick={() => navigate("/verify-otp")}
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
            Reset Password
          </h1>

          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Enter your new password below.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-lg">

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-y-5 sm:gap-y-6"
          >

            <Input
              type="password"
              label="New Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              icon={LockKeyhole}
              helperText="Min 8 chars — must include upper & lowercase letters and a number"
            />

            <Input
              type="password"
              label="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
              icon={LockKeyhole}
            />

            <Button
              type="submit"
              isLoading={loading}
              ariaLabel={loading ? "Resetting password..." : "Reset password"}
              className="w-full"
            >
              Reset Password
            </Button>

          </form>

        </div>
      </div>
    </main>
  );
}