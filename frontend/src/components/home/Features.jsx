import { useAuthContext } from "../../contexts/AuthContext";
import { FEATURES } from "../../utils/constants";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";

function Features() {
  const { isAuthenticated } = useAuthContext();

  return (
    <article
      id="features"
      className="bg-white py-16 sm:py-20 lg:py-32 overflow-hidden relative"
    >
      {/* Subtle bg gradient */}
      <div className="bg-linear-to-b from-blue-50/50 via-transparent to-blue-50/50 absolute inset-0" />

      <div className="max-w-7xl px-6 lg:px-8 mx-auto relative">
        {/* Header */}
        <header className="text-center space-y-4 mb-16">
          <div className="bg-blue-100 rounded-full px-4 py-2 inline-flex items-center gap-2 w-fit mx-auto">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-blue-900 text-sm font-semibold">
              Features
            </span>
          </div>

          <h2 className="text-gray-900 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Your Complete
            <br />
            <span className="text-blue-600">Author Toolkit</span>
          </h2>

          <p className="max-w-2xl text-gray-600 mx-auto">
            From blank page to bestseller—everything you need is built right in,
            ready when inspiration strikes.
          </p>
        </header>

        {/* Features grid */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(
            ({
              title,
              icon: FeatIcon,
              description,
              bgGradientColors,
              shadowColor,
            }) => (
              <li
                key={title}
                className="bg-white border border-gray-100 rounded-2xl p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 relative group"
              >
                <div
                  className={`w-14 h-14 bg-linear-to-br ${bgGradientColors} rounded-xl shadow-lg ${shadowColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}
                >
                  {FeatIcon && (
                    <FeatIcon className="w-6 h-6 text-white" />
                  )}
                </div>

                <h3 className="text-gray-900 text-lg font-bold mt-4 mb-2 group-hover:text-blue-900 transition-colors">
                  {title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed">
                  {description}
                </p>

                <Link
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  className="text-blue-600 mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-sm font-medium">Learn more</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            )
          )}
        </ul>

        {/* CTA */}
        <footer className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            Ready to bring your book to life?
          </p>

          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="bg-linear-to-r from-blue-600 to-blue-600 text-white font-semibold rounded-xl px-8 py-3 shadow-lg inline-flex items-center gap-2 transition-all duration-200 hover:shadow-xl hover:scale-105"
          >
            <span>
              {isAuthenticated ? "My Writing Space" : "Launch Your First Book"}
            </span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </footer>
      </div>
    </article>
  );
}

export default Features;
