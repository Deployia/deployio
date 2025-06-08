function Spinner({ fullScreen = false, size = 56 }) {
  // Box loader: 3 animated boxes
  const boxSize = Math.max(10, Math.floor(size / 4));
  const gap = Math.max(4, Math.floor(size / 8));
  const loader = (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: boxSize }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`bg-white animate-box-bounce rounded-[2px]`}
          style={{
            width: boxSize,
            height: boxSize,
            marginLeft: i === 0 ? 0 : gap,
            animationDelay: `${i * 0.18}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes box-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 1; }
          40% { transform: translateY(-${boxSize * 0.7}px); opacity: 0.5; }
        }
        .animate-box-bounce {
          animation: box-bounce 1s infinite cubic-bezier(.6,.05,.6,.95);
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black z-50">
        {loader}
      </div>
    );
  }

  return <span className="inline-flex items-center">{loader}</span>;
}

export default Spinner;
