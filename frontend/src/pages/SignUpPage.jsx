// import { useState } from "react";
// import { useAuthContext } from "../contexts/AuthContext";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import toast from "react-hot-toast";
// import { LockKeyhole, Mail, User2, ArrowLeft } from "lucide-react";
// import { Button, Input, LogoIcon } from "../components";
// import axiosInstance from "../lib/axios";
// import { API_ENDPOINTS } from "../utils/api-endpoints";
// import {
//   validateName,
//   validateEmail,
//   validatePassword,
// } from "../utils/helpers";

// function SignUpPage() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [errors, setErrors] = useState({ name: "", email: "", password: "" });

//   const { authenticateUser } = useAuthContext();
//   const navigate = useNavigate();
//   const location = useLocation();

//   // get the page user was trying to access, default to dashboard
//   // see ProtectedRoute.jsx
//   const fromPath = location.state?.from?.pathname || "/dashboard";

//   const handleChange = (event) => {
//     const { name, value } = event.target;

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));

//     // clear error for this field when user starts typing
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }
//   };

//   const validateForm = (trimmedData) => {
//     const nameError = validateName(trimmedData.name);
//     const emailError = validateEmail(trimmedData.email);
//     const passwordError = validatePassword(trimmedData.password);

//     setErrors({
//       name: nameError,
//       email: emailError,
//       password: passwordError,
//     });

//     return !nameError && !emailError && !passwordError;
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();

//     const trimmedData = {
//       name: formData.name.trim(),
//       email: formData.email.trim(),
//       password: formData.password.trim(),
//     };

//     if (!validateForm(trimmedData)) {
//       return;
//     }

//     setIsLoading(true);

//     try {
//       // registration request
//       const {
//         data: { token },
//       } = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, trimmedData);

//       // get profile info
//       const { data: profileInfo } = await axiosInstance.get(
//         API_ENDPOINTS.PROFILE.GET,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       // update auth context
//       authenticateUser(token, profileInfo.user);

//       toast.success("Welcome aboard, Author!");

//       // navigate to the page user was trying to access
//       navigate(fromPath, { replace: true });
//     } catch (error) {
//       console.error("Error signing up:", error?.message);

//       const errorMessage =
//         error?.response?.data?.error ||
//         error?.response?.data?.message ||
//         "Sign up failed. Please try again.";

//       toast.error(errorMessage, { duration: 5000 });

//       // show error in form (email is more likely to have issues like "already exists")
//       setErrors((prev) => ({
//         ...prev,
//         email: errorMessage,
//       }));

//       // clear sensitive data on error
//       localStorage.clear();
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex justify-center items-center">
//           <button
//         onClick={() => navigate("/")}
//         className="absolute top-6 left-6 inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-200 hover:-translate-x-1"
//       >
//         <ArrowLeft className="w-5 h-5" />
//         <span className="text-lg font-medium">Back</span>
//       </button>
//       <div className="w-full max-w-md">
//         <div className="text-center mb-6 sm:mb-8">
//           <div className="size-14 sm:size-16 bg-linear-to-br from-blue-400 to-blue-500 rounded-full mx-auto mb-3 sm:mb-4 shadow-md flex justify-center items-center">
//             <LogoIcon className="size-7 sm:size-8 text-white" />
//           </div>

//           <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold">
//             Create Your Account
//           </h1>

//           <p className="text-slate-600 text-sm sm:text-base mt-2">
//             Start imprinting books with AI &mdash; your story begins here.
//           </p>
//         </div>

//         <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-lg">
//           <form
//             onSubmit={handleSubmit}
//             className="grid grid-cols-1 gap-y-5 sm:gap-y-6"
//           >
//             <Input
//               type="text"
//               label="Full Name"
//               name="name"
//               value={formData.name}
//               onChange={handleChange}
//               required
//               placeholder="John Doe"
//               icon={User2}
//               error={errors.name}
//             />

//             <Input
//               type="email"
//               label="Email"
//               name="email"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               placeholder="email@example.com"
//               icon={Mail}
//               error={errors.email}
//             />

//             <Input
//               type="password"
//               label="Password"
//               name="password"
//               value={formData.password}
//               onChange={handleChange}
//               required
//               placeholder="••••••••"
//               icon={LockKeyhole}
//               error={errors.password}
//               helperText={
//                 !errors.password &&
//                 "Min 8 chars — must include upper & lowercase letters and a number"
//               }
//             />

//             <Button
//               type="submit"
//               isLoading={isLoading}
//               ariaLabel={isLoading ? "Creating account..." : "Sign up"}
//               className="w-full"
//             >
//               Sign up
//             </Button>
//           </form>

//           <p className="text-slate-600 text-center text-xs sm:text-sm mt-6 sm:mt-8">
//             Already have an account?{" "}
//             <Link
//               to="/login"
//               className="text-blue-600 font-medium transition-all duration-200 hover:text-blue-700 hover:underline focus-visible:text-blue-700 focus-visible:underline"
//             >
//               Sign in
//             </Link>
//           </p>
//         </div>
//       </div>
//     </main>
//   );
// }

// export default SignUpPage;

import { useState } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { LockKeyhole, Mail, User2, ArrowLeft, Info } from "lucide-react";
import { Button, Input, LogoIcon } from "../components";
import axiosInstance from "../lib/axios";
import { API_ENDPOINTS } from "../utils/api-endpoints";
import {
  validateName,
  validateEmail,
  validatePassword,
} from "../utils/helpers";

function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });

  const { authenticateUser } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const fromPath = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (trimmedData) => {
    const nameError = validateName(trimmedData.name);
    const emailError = validateEmail(trimmedData.email);
    const passwordError = validatePassword(trimmedData.password);

    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError,
    });

    return !nameError && !emailError && !passwordError;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password.trim(),
    };

    if (!validateForm(trimmedData)) return;

    setIsLoading(true);

    try {
      const {
        data: { token },
      } = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, trimmedData);

      const { data: profileInfo } = await axiosInstance.get(
        API_ENDPOINTS.PROFILE.GET,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      authenticateUser(token, profileInfo.user);

      toast.success("Welcome aboard, Author!");

      navigate(fromPath, { replace: true });
    } catch (error) {
      console.error("Error signing up:", error?.message);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Sign up failed. Please try again.";

      toast.error(errorMessage, { duration: 5000 });

      setErrors((prev) => ({
        ...prev,
        email: errorMessage,
      }));

      localStorage.clear();
    } finally {
      setIsLoading(false);
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
            Create Your Account
          </h1>

          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Start imprinting books with AI &mdash; your story begins here.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-lg">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-y-5 sm:gap-y-6"
          >
            {/* Name */}
            <Input
              type="text"
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              icon={User2}
              error={errors.name}
            />

            {/* Email with Tooltip */}
            <div className="relative">
              {/* Label */}
              <label className=" text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Email <span className="text-red-500">*</span>
                <div className="relative group ml-1">
                  <Info className="w-4 h-4 text-slate-500 cursor-pointer" />

                  {/* Tooltip */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-72 bg-[#F7F3E9] border border-amber-200 text-sm text-slate-700 rounded-lg p-3 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    {/* Arrow */}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F7F3E9] border-l border-b border-amber-200 rotate-45"></div>
                    Use a valid email address. If you forget your password, you
                    can reset it using the OTP sent to this email.
                  </div>
                </div>
              </label>

              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
                icon={Mail}
                error={errors.email}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className=" text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                Password <span className="text-red-500">*</span>
                <div className="relative group ml-1">
                  <Info className="w-4 h-4 text-slate-500 cursor-pointer" />

                  {/* Tooltip */}
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-72 bg-[#F7F3E9] border border-amber-200 text-sm text-slate-700 rounded-lg p-3 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    {/* Arrow */}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#F7F3E9] border-l border-b border-amber-200 rotate-45"></div>
                   Min 8 chars — must include upper & lowercase letters and a number.
                  </div>
                </div>
              </label>

              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                icon={LockKeyhole}
                error={errors.password}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              isLoading={isLoading}
              ariaLabel={isLoading ? "Creating account..." : "Sign up"}
              className="w-full"
            >
              Sign up
            </Button>
          </form>

          <p className="text-slate-600 text-center text-xs sm:text-sm mt-6 sm:mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-medium transition-all duration-200 hover:text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default SignUpPage;
