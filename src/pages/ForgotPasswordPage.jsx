// src/pages/ForgotPasswordPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from "@mui/material";

import { styled } from "@mui/material/styles";

import { auth } from "../firebase";
import { sendPasswordResetEmail, signOut } from "firebase/auth";

import AppTopBar from "../components/AppTopBar";
import LandingPageBackground from "../components/LandingPageBackground";

const ForgotPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 480,
  margin: "24px auto",
}));

export default function ForgotPasswordPage({ themeMode, toggleTheme }) {
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");

  // 如果目前有登入，就幫忙帶入 email（但仍允許修改）
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.email) {
      setEmail(user.email);
    }
  }, []);

  const handleSendReset = async () => {
    setMessage("");

    if (!email.trim()) {
      setMessage("請輸入電子郵件。");
      return;
    }

    setSending(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        // 重設完按 Continue 之後要回哪一頁（依你實際路由調整）
        url: "https://shuan0402.github.io/selfMap/#/login",

        handleCodeInApp: false,
      });

      setMessage("已寄出重設密碼連結，請到信箱收信。");
    } catch (err) {
      console.error(err);
      setMessage("寄送重設信件失敗：" + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    // 回到登入頁
    navigate("/login"); // 如果你的 AuthPage 是 "/"，就改成 "/"
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
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
      <LandingPageBackground />
      
      <AppTopBar
        variant="back"
        themeMode={themeMode}
        toggleTheme={toggleTheme}
        userName={auth.currentUser?.displayName || "訪客"}
        onLogout={handleLogout}
        onBack={handleBack}
      />

      <Container maxWidth="sm">
        <ForgotPaper elevation={3}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            忘記密碼
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            請輸入你的帳號電子郵件，我們會寄送一封「重設密碼」連結。
          </Typography>

          {/* ✅ 改成可以輸入的 email 欄位 */}
          <TextField
            fullWidth
            type="email"
            label="電子郵件"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            helperText="重設密碼連結將寄送至此信箱"
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSendReset}
              disabled={sending || !email}
            >
              寄送重設密碼連結
            </Button>
          </Box>

          {message && (
            <Alert
              severity={message.includes("失敗") ? "error" : "success"}
              sx={{ mt: 2 }}
            >
              {message}
            </Alert>
          )}
        </ForgotPaper>
      </Container>
    </Box>
  );
}
