import React from "react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmDisabled?: boolean;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirm",
  onConfirm,
  confirmDisabled = false,
}: ModalProps) {
  if (!open) return null;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 1,
  };

  const boxStyle: React.CSSProperties = {
    background: "#12121c",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 0,
    padding: "32px",
    maxWidth: "560px",
    width: "calc(100% - 32px)",
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: "1.5rem",
    color: "#e8e6f0",
    marginBottom: "16px",
    fontWeight: 300,
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px",
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={boxStyle}>
        <h2 style={titleStyle}>{title}</h2>
        <div>{children}</div>
        <div style={footerStyle}>
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          {onConfirm && (
            <Button
              variant="gradient"
              onClick={onConfirm}
              disabled={confirmDisabled}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
