import { Link } from 'react-router-dom';
import { APP_NAME } from '../lib/constants';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-emerald mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-emerald hover:bg-emerald/90 text-white font-medium rounded-lg transition-colors"
        >
          Back to {APP_NAME}
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
