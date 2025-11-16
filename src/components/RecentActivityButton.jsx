// src/components/RecentActivityButton.jsx
import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";

import { auth } from "../firebase";
import RecentActivityDialog from "./RecentActivityDialog";

export default function RecentActivityButton() {
  const [open, setOpen] = useState(false);
  const user = auth.currentUser;
  const userId = user?.uid || null;

  const handleOpen = () => {
    if (!userId) return;
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  if (!userId) return null;

  return (
    <>
      <Tooltip title="最近消息">
        <IconButton color="inherit" onClick={handleOpen}>
          <HistoryIcon />
        </IconButton>
      </Tooltip>

      <RecentActivityDialog
        open={open}
        onClose={handleClose}
        userId={userId}
      />
    </>
  );
}
