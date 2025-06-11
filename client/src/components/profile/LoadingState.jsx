const LoadingState = ({ message = "Loading...", className = "" }) => {
  return (
    <div
      className={`bg-neutral-900/50 backdrop-blur-md border border-neutral-800/50 rounded-xl p-8 ${className}`}
    >
      <div className="flex flex-col items-center justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
        <p className="text-gray-400 text-center">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
