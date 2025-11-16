// src/components/FullImageDialog.jsx
import Dialog from "@mui/material/Dialog";

export default function FullImageDialog({ src, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      {src && (
        <img
          src={src}
          alt="放大圖片"
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      )}
    </Dialog>
  );
}
