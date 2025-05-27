function Spinner({ fullScreen = false, size = 56 }) {
  const spinnerCircle = (
    <div
      className={`animate-spin rounded-full border-4 border-t-blue-500 border-b-blue-500 border-gray-200`}
      style={{ width: size, height: size }}
    ></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white/60 z-50">
        {spinnerCircle}
      </div>
    );
  }
  // Inline spinner for button or small area
  return <span className="inline-flex items-center">{spinnerCircle}</span>;
}

export default Spinner;
