// src/components/AppTopBar.jsx
import { useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

import MapIcon from "@mui/icons-material/Map";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";        // ⭐ 新增：小房子圖示

import ThemeToggle from "./ThemeToggle";
import AboutDialog from "./About";
import RecentActivityButton from "./RecentActivityButton";

/**
 * 通用頂部欄
 *
 * props:
 * - variant: 'maps' | 'back'
 * - themeMode, toggleTheme
 * - userName
 * - onLogout
 * - onBack
 */
export default function AppTopBar({
  variant = "maps",
  themeMode,
  toggleTheme,
  userName,
  onLogout,
  onBack,
}) {
  const navigate = useNavigate();
  const safeUserName = userName || "未命名使用者";

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleGoHome = () => {
    navigate("/maps"); // 首頁 = 地圖列表
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* 左側：依 variant 顯示 */}
        {variant === "maps" ? (
          <>
            <MapIcon sx={{ mr: 1 }} />
            <Typography
              variant="h6"
              sx={{ cursor: "pointer" }}
              onClick={handleGoHome}
            >
              SelfMap
            </Typography>
          </>
        ) : (
          <>
            <IconButton edge="start" sx={{ mr: 1 }} onClick={handleBack}>
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{ cursor: "pointer" }}
              onClick={handleGoHome}
            >
              SelfMap
            </Typography>
          </>
        )}

        {/* 中間撐開 */}
        <Box sx={{ flexGrow: 1 }} />

        {/* 使用者名稱：可以點進使用者頁面 */}
        <Typography
          variant="body2"
          sx={{
            mr: 2,
            cursor: "pointer",
            whiteSpace: "nowrap",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={() => navigate("/user")}
        >
          {safeUserName}
        </Typography>

        {/* 主題切換 */}
        <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} />

        {/* 最近消息 */}
        <RecentActivityButton />

        {/* 關於 */}
        <AboutDialog />

        {/* 登出 */}
        <IconButton color="inherit" onClick={onLogout}>
          <LogoutIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
