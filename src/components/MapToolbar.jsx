// src/components/MapToolbar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";

import MapMoreMenu from "./MapMoreMenu";
import AboutDialog from "./About";
import ThemeToggle from "./ThemeToggle";
import RecentActivityButton from "./RecentActivityButton";

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
  userName,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const safeUserName = userName || "未命名使用者";

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        {/* 左側：返回按鈕 + 標題 */}
        <IconButton edge="start" sx={{ mr: 1 }} onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {title || "地圖"}
        </Typography>

        {/* 使用者名稱：可點擊進入使用者空間 */}
        <Typography
          variant="body2"
          sx={{
            mr: 2,
            cursor: "pointer",
            whiteSpace: "nowrap",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => navigate("/me")}
        >
          {safeUserName}
        </Typography>

        {/* 主題切換 */}
        <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} />

        {/* 最近消息按鈕 */}
        <RecentActivityButton />

        {/* 關於 SelfMap */}
        <AboutDialog />

        {/* 更多選單（重新命名、刪除、分享、清除地標） */}
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

        {/* 登出 */}
        <IconButton color="inherit" onClick={onLogout}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
