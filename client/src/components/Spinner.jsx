function Spinner({ fullScreen = false, size = 56 }) {
  const spinnerCircle = (
    <div
      // Apply themed border colors for the spinner - only top border will be accent
      className={`animate-spin rounded-full border-4 border-t-[rgb(var(--accent-primary))] border-[rgb(var(--border-color))]`}
      style={{ width: size, height: size }}
    ></div>
  );

  if (fullScreen) {
    return (
      // Apply themed background for the full-screen overlay
      <div className="fixed inset-0 flex justify-center items-center bg-[rgba(var(--bg-primary-rgb),0.6)] z-50">
        {spinnerCircle}
      </div>
    );
  }
  // Inline spinner for button or small area
  return <span className="inline-flex items-center">{spinnerCircle}</span>;
}

export default Spinner;
