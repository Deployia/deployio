import { useEffect, useRef, useState } from "react";
import { useModal } from "../context/ModalContext.jsx";

const Modal = () => {
  const { isModalOpen, closeModal, modalContent } = useModal();
  const [shouldRender, setShouldRender] = useState(false);
  const [animate, setAnimate] = useState(false);
  const modalRef = useRef(null);

  // Mount/unmount logic for animation
  useEffect(() => {
    if (isModalOpen) {
      setShouldRender(true);
      setAnimate(false); // Reset animate to false before triggering
      requestAnimationFrame(() => setAnimate(true));
    } else if (shouldRender) {
      setAnimate(false);
      const timeout = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isModalOpen, shouldRender]);

  // Close on Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeModal]);

  // Close on click outside
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeModal();
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
        animate ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-xl min-w-[320px] max-w-[90vw] md:max-w-lg p-8 shadow-2xl relative transform transition-all duration-300 ${
          animate ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {modalContent}
      </div>
    </div>
  );
};

export default Modal;
