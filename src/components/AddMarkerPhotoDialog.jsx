// src/components/AddMarkerPhotoDialog.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
} from "@mui/material";

export default function AddMarkerPhotoDialog({
  open,
  onClose,
  onFileSelected,
}) {
  const handleChange = (e) => {
    onFileSelected(e);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>新增地標照片</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          請選擇新增照片方式：
        </Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            mt: 2,
          }}
        >
          <Button variant="contained" component="label" color="primary" fullWidth>
            拍照
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleChange}
            />
          </Button>

          <Button variant="outlined" component="label" fullWidth>
            上傳照片
            <input type="file" accept="image/*" hidden onChange={handleChange} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
      </DialogActions>
    </Dialog>
  );
}
