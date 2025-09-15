// src/components/AboutIcon.jsx
import React, { useState } from "react";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Tooltip,
  Link,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { GitHub, Email } from "@mui/icons-material";

export default function AboutIcon() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Tooltip title="關於作者">
        <IconButton onClick={handleOpen} color="inherit" size="medium">
          <InfoOutlinedIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ textAlign: "center" }}>作者資訊</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          {/* 作者名字 */}
          <Typography variant="body1">
            作者：Shuan Ho
          </Typography>

          {/* 聯絡方式 icons */}
          <div style={{ display: "flex", gap: "20px" }}>
            <Tooltip title="Gmail">
              <IconButton
                component={Link}
                href="mailto:st980155@gmail.com"
                color="inherit"
                target="_blank"
              >
                <Email fontSize="large" />
              </IconButton>
            </Tooltip>

            <Tooltip title="GitHub">
              <IconButton
                component={Link}
                href="https://github.com/Shuan0402"
                color="inherit"
                target="_blank"
              >
                <GitHub fontSize="large" />
              </IconButton>
            </Tooltip>
          </div>

          {/* 著作權 */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: "center" }}
          >
            © {new Date().getFullYear()} Shuan Ho. All rights reserved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <IconButton onClick={handleClose} color="primary">
            <Typography sx={{ fontSize: "0.8rem" }}>關閉</Typography>
          </IconButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
