import { APP_NAME } from '../../lib/constants';

function EmptyState({ message = 'Menunggu Host memulai siaran...' }) {
  return (
    <div className="h-full w-full bg-slate-900 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🎥</span>
          </div>
          <h2 className="text-2xl font-bold text-emerald mb-2">{APP_NAME}</h2>
        </div>

        {/* Message */}
        <p className="text-gray-400 text-lg">{message}</p>

        {/* Animated dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-3 h-3 bg-emerald rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-emerald rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-emerald rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default EmptyState;