// src/components/MapToolbar.jsx
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";

import MapMoreMenu from "./MapMoreMenu";
import AboutDialog from "./About";
import ThemeToggle from "./ThemeToggle";

import { useState } from "react";

export default function MapToolbar({
  title,
  themeMode,
  toggleTheme,
  map,
  onRename,
  onDelete,
  onShare,
  onClearMarkers,
  onLogout,
  onBack,
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <IconButton edge="start" sx={{ mr: 2 }} onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title || "地圖"}
        </Typography>

        <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} />
        <AboutDialog />

        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>

        <MapMoreMenu
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          map={map}
          onRename={onRename}
          onDelete={onDelete}
          onShare={onShare}
          onClearMarkers={onClearMarkers}
        />

        <IconButton color="inherit" onClick={onLogout}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
