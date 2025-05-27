import React from "react";

function Spinner({ fullScreen = false }) {
  const spinnerCircle = (
    <div className="animate-spin rounded-full border-4 border-t-blue-500 border-b-blue-500 border-gray-200 h-14 w-14"></div>
  );

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white/60 z-50">
      {spinnerCircle}
    </div>
  );
}

export default Spinner;
