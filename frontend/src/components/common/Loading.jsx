import { Loader2 } from 'lucide-react';

const Loading = ({ fullscreen = false, text = 'Loading...' }) => {
  if (fullscreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-600 text-sm">{text}</p>
      </div>
    </div>
  );
};

export const Spinner = ({ size = 'medium', className = '' }) => {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <Loader2 className={`${sizes[size]} text-primary-600 animate-spin ${className}`} />
  );
};

export default Loading;