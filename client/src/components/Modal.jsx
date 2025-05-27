import React, { useEffect, useRef } from "react";
import { useModal } from "../context/ModalContext.jsx";

const Modal = () => {
  const { isModalOpen, closeModal, modalContent } = useModal();
  const modalRef = useRef(null);

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

  if (!isModalOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: "#fff",
          borderRadius: 8,
          minWidth: 320,
          maxWidth: 480,
          padding: 32,
          boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {modalContent}
      </div>
    </div>
  );
};

export default Modal;
