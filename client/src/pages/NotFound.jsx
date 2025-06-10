import { Link } from "react-router-dom";
import SEO from "@components/SEO.jsx";

function NotFound() {
  return (
    <>
      <SEO page="notFound" />
      <div className="min-h-[90vh] bg-black flex items-center justify-center py-10 px-2 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full text-center">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-700 p-10">
            <h1 className="text-6xl font-extrabold text-white mb-4">404</h1>
            <h2 className="text-2xl font-bold text-white mb-2">
              Page Not Found
            </h2>
            <p className="text-neutral-400 mb-6">
              Sorry, the page you are looking for does not exist.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-neutral-800 text-white font-semibold rounded-lg border border-neutral-700 hover:bg-neutral-700 hover:border-white transition-all duration-200"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;
