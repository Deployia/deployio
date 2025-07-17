const AuthDivider = ({ text = "or continue with" }) => {
  return (
    <div className="relative my-4 sm:my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neutral-700" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-2 sm:px-3 bg-neutral-900 text-neutral-500">
          {text}
        </span>
      </div>
    </div>
  );
};

export default AuthDivider;
