// src/components/AboutIcon.jsx
import React, { useState } from "react";
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Tooltip } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

export default function AboutIcon() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      {/* 單一圓圈驚嘆號按鈕 */}
      <Tooltip title="關於作者">
        <IconButton
          onClick={handleOpen}
          color="inherit"
          size="medium"
        >
          <InfoOutlinedIcon />
        </IconButton>
      </Tooltip>

      {/* 彈窗 */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>作者資訊</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            作者：Shuan Ho
          </Typography>
          <Typography variant="body2" color="textSecondary">
            著作權 © {new Date().getFullYear()} Shuan Ho. 保留所有權利。
          </Typography>
        </DialogContent>
        <DialogActions>
          <IconButton onClick={handleClose} color="primary">
            關閉
          </IconButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
