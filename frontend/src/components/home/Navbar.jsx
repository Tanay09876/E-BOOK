import { useEffect, useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import ProfileMenu from "../ProfileMenu";
import LogoIcon from "../LogoIcon";

const navLinks = [
  { label: "Features", hash: "#features" },
  { label: "Testimonials", hash: "#testimonials" },
];

function Navbar() {
  const { isAuthenticated, user, unauthenticateUser } = useAuthContext();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ CLOSE MOBILE MENU WHEN SCREEN >= LG
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignout = () => {
    unauthenticateUser(() => navigate("/", { replace: true }));
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ================= HEADER ================= */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl h-16 px-6 lg:px-8 mx-auto flex justify-between items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="w-9 h-9 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <LogoIcon className="w-5 h-5 text-white" />
            </span>
            <span className="text-xl font-semibold text-gray-900">
            Leafora
            </span>
          </Link>

          {/* ===== DESKTOP NAV ===== */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(({ label, hash }) => (
              <a
                key={label}
                href={hash}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* ===== DESKTOP AUTH ===== */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <ProfileMenu
                avatarUrl={user?.avatar}
                username={user?.name}
                email={user?.email}
                signoutCallback={handleSignout}
              />
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 text-sm font-medium hover:text-blue-600"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-linear-to-r from-blue-600 to-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg shadow-md hover:opacity-90 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* ===== MOBILE BUTTON ===== */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* ===== MOBILE OVERLAY ===== */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ===== MOBILE DRAWER ===== */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close */}
        <div className="flex justify-end p-5">
          <button onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Centered Nav */}
        <nav className="flex flex-col items-center gap-6 mt-10">
          {navLinks.map(({ label, hash }) => (
            <a
              key={label}
              href={hash}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-lg font-medium text-gray-800 hover:text-blue-600 transition"
            >
              {label}
            </a>
          ))}

          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-gray-700 hover:text-blue-600 transition"
              >
                Sign in
              </Link>

              <Link
                to="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 bg-linear-to-r from-blue-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
}

export default Navbar;
