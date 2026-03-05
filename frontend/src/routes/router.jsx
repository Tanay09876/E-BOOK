// import { createBrowserRouter } from "react-router-dom";
// import {
//   BookPage,
//   DashboardPage,
//   EditBookPage,
//   ErrorPage,
//   LandingPage,
//   ProfilePage,
//   SignInPage,
//   SignUpPage,
// } from "../pages";
// import ProtectedRoute from "./ProtectedRoute";
// import PublicRoute from "./PublicRoute";

// const router = createBrowserRouter([
//   {
//     path: "/",
//     // root error boundary catches all errors
//     errorElement: <ErrorPage />,
//     children: [
//       {
//         index: true,
//         element: <LandingPage />,
//       },
//       {
//         path: "register",
//         element: (
//           <PublicRoute>
//             <SignUpPage />
//           </PublicRoute>
//         ),
//       },
//       {
//         path: "login",
//         element: (
//           <PublicRoute>
//             <SignInPage />
//           </PublicRoute>
//         ),
//       },
//       {
//         path: "dashboard",
//         element: (
//           <ProtectedRoute>
//             <DashboardPage />
//           </ProtectedRoute>
//         ),
//       },
//       {
//         path: "books/:bookId",
//         element: (
//           <ProtectedRoute>
//             <BookPage />
//           </ProtectedRoute>
//         ),
//       },
//       {
//         path: "books/:bookId/edit",
//         element: (
//           <ProtectedRoute>
//             <EditBookPage />
//           </ProtectedRoute>
//         ),
//       },
//       {
//         path: "profile",
//         element: (
//           <ProtectedRoute>
//             <ProfilePage />
//           </ProtectedRoute>
//         ),
//       },
//       // catch-all for 404s
//       {
//         path: "*",
//         element: <ErrorPage />,
//       },

//     ],
//   },
// ]);

// export default router;
import { createBrowserRouter } from "react-router-dom";
import {
  BookPage,
  DashboardPage,
  EditBookPage,
  ErrorPage,
  LandingPage,
  ProfilePage,
  SignInPage,
  SignUpPage,
  ResetPasswordPage,
  ForgotPasswordPage,
  VerifyOtpPage,

} from "../pages";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

const router = createBrowserRouter([
  {
    path: "/",
    // root error boundary catches all errors
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "register",
        element: (
          <PublicRoute>
            <SignUpPage />
          </PublicRoute>
        ),
      },
      {
        path: "login",
        element: (
          <PublicRoute>
            <SignInPage />
          </PublicRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "books/:bookId",
        element: (
          <ProtectedRoute>
            <BookPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "books/:bookId/edit",
        element: (
          <ProtectedRoute>
            <EditBookPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      // catch-all for 404s
      {
        path: "*",
        element: <ErrorPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "verify-otp",
        element: <VerifyOtpPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
]);

export default router;
