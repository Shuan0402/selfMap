// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  IconButton,
  Link,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EmailIcon from "@mui/icons-material/Email";
import GitHubIcon from "@mui/icons-material/GitHub";

import AppTopBar from "../components/AppTopBar";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

// 中間那塊主內容卡片
const MainPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  backdropFilter: "blur(10px)",
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(15, 23, 42, 0.9)"
      : "rgba(255, 255, 255, 0.96)",
}));

export default function LandingPage({ themeMode, toggleTheme }) {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const ctaLabel = user ? "前往我的地圖" : "開始使用";

  const handleStart = () => {
    if (user) {
      navigate("/maps");
    } else {
      navigate("/login"); // 如果你的登入頁是 "/"，這裡改成 navigate("/");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // 如果 AuthPage 在 "/"，就改為 navigate("/");
    } catch (err) {
      console.error("登出失敗：", err);
    }
  };

  const handleBack = () => {
    // 封面頁通常不用返回功能，可以保留空的，或之後想導別的地方再補
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor:
          theme.palette.mode === "dark"
            ? theme.palette.background.default
            : theme.palette.grey[50],
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
      })}
    >
      {/* 背景圖層（在最底層） */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        {/* 大圓形 1 */}
        <Box
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              position: "absolute",
              width: 520,
              height: 520,
              borderRadius: "50%",
              top: -160,
              right: -100,
              // 明：藍，暗：白
              backgroundColor: isDark ? "#F9FAFB" : theme.palette.primary.main,
              opacity: isDark ? 0.35 : 0.45,
            };
          }}
        />

        {/* 大圓形 2 */}
        <Box
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: "50%",
              bottom: -160,
              left: -80,
              // 明：灰，暗：灰
              backgroundColor: isDark ? "#64748B" : theme.palette.grey[300],
              opacity: isDark ? 0.35 : 0.4,
            };
          }}
        />

        {/* 矩形 1 */}
        <Box
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              position: "absolute",
              width: 320,
              height: 160,
              borderRadius: 40,
              top: "42%",
              left: "6%",
              transform: "rotate(-8deg)",
              // 明：淺藍，暗：白
              backgroundColor: isDark ? "#FFFFFF" : theme.palette.primary.light,
              opacity: isDark ? 0.3 : 0.35,
            };
          }}
        />

        {/* 矩形 2 */}
        <Box
          sx={(theme) => {
            const isDark = theme.palette.mode === "dark";
            return {
              position: "absolute",
              width: 300,
              height: 150,
              borderRadius: 40,
              bottom: "18%",
              right: "5%",
              transform: "rotate(6deg)",
              // 明：灰，暗：較深灰
              backgroundColor: isDark ? "#475569" : theme.palette.grey[200],
              opacity: isDark ? 0.25 : 0.3,
            };
          }}
        />
      </Box>

      {/* 上方 Bar：在背景上層 */}
      <Box sx={{ position: "relative", zIndex: 2 }}>
        <AppTopBar
          variant="landing"
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          userName={auth.currentUser?.displayName || " "}
          onLogout={handleLogout}
          onBack={handleBack}
        />
      </Box>

      {/* 中間內容 */}
      <Container
        maxWidth="lg"
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pb: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <MainPaper elevation={8} sx={{ width: "100%" }}>
          {/* 網頁名稱 */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              SelfMap
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              記錄你的私房景點，讓回憶留在地圖上。
            </Typography>
          </Box>

          {/* 左右排列：左＝介紹，右＝功能 */}
          <Box
            sx={{
              maxWidth: 960,
              mx: "auto",
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { xs: 4, md: 8 },
              mt: 2,
            }}
          >
            {/* 左：網頁介紹 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={2}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, borderLeft: 4, pl: 1.5 }}
                >
                  網頁介紹
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8 }}
                >
                  SelfMap 是一個用來記錄與整理個人景點的小工具。
                  你可以把每次旅行的足跡、照片與想法放進自己的地圖裡，
                  讓它慢慢累積成一張屬於你的回憶地圖。
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8 }}
                >
                  你也能把地圖分享給朋友，一起補上彼此的足跡，
                  在同一張地圖上留下共同的故事。
                </Typography>
              </Stack>
            </Box>

            {/* 右：網頁功能 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack spacing={2}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, borderLeft: 4, pl: 1.5 }}
                >
                  網頁功能
                </Typography>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    功能 1｜記錄景點
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.8 }}
                  >
                    使用定位與照片快速建立地標，為每個景點留下標題、地址與備註。
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    功能 2｜分享地圖
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.8 }}
                  >
                    透過分享連結讓朋友也能加入，共同維護同一張地圖。
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    功能 3｜備註與評論
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.8 }}
                  >
                    留言備註，記錄當時的心情與回憶，並觀看朋友們的評論，增添互動樂趣。
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* 下方置中的文字按鈕 */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 4,
            }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={handleStart}
            >
              {ctaLabel}
            </Button>
          </Box>
        </MainPaper>
      </Container>

      {/* 最下方：作者資訊三個圓形 */}
      <Box
        component="footer"
        sx={{
          py: 3,
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            mb: 1,
          }}
        >
          {/* 作者頭像 */}
          <Box
            component={Link}
            href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1"
            target="_blank"
            underline="none"
            sx={(theme) => ({
              width: 48,
              height: 48,
              borderRadius: "50%",
              overflow: "hidden",
              boxShadow: theme.shadows[3],
              bgcolor: "background.paper",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: theme.shadows[6],
              },
            })}
          >
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}img/Shuan.png`}
              alt="作者頭像"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>

          {/* 信箱 */}
          <IconButton
            component={Link}
            href="mailto:st980155@gmail.com"
            color="inherit"
            sx={(theme) => ({
              width: 48,
              height: 48,
              borderRadius: "50%",
              boxShadow: theme.shadows[3],
              bgcolor: "background.paper",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: theme.shadows[6],
                bgcolor: "background.paper",
              },
            })}
          >
            <EmailIcon />
          </IconButton>

          {/* GitHub */}
          <IconButton
            component={Link}
            href="https://github.com/Shuan0402"
            target="_blank"
            rel="noopener"
            color="inherit"
            sx={(theme) => ({
              width: 48,
              height: 48,
              borderRadius: "50%",
              boxShadow: theme.shadows[3],
              bgcolor: "background.paper",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: theme.shadows[6],
                bgcolor: "background.paper",
              },
            })}
          >
            <GitHubIcon />
          </IconButton>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 0.5 }}
        >
          © {new Date().getFullYear()} Shuan Ho. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
