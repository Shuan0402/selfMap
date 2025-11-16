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
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { styled } from "@mui/material/styles";

import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";

import ThemeToggle from "../components/ThemeToggle";
import AboutDialog from "../components/About";

const ForgotPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 480,
  margin: "24px auto",
}));

export default function ForgotPasswordPage({ themeMode, toggleTheme }) {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // 如果沒登入，就導回登入頁（或首頁）
    if (!user) {
      navigate("/");
      return;
    }

    setEmail(user.email || "");
  }, [user, navigate]);

  const handleSendReset = async () => {
    setMessage("");

    const user = auth.currentUser;
    if (!user || !user.email) {
        setMessage("目前沒有登入使用者，無法重設密碼。");
        return;
    }

    setSending(true);
    try {
        await sendPasswordResetEmail(auth, user.email, {
        // 這裡只決定 Firebase 重設完按 Continue 之後要回哪一頁
        url: `${window.location.origin}/selfMap/#/login`,
        handleCodeInApp: false,   // 或乾脆不加這個設定
        });

        setMessage("已寄出重設密碼連結，請到信箱收信。");
    } catch (err) {
        console.error(err);
        setMessage("寄送重設信件失敗：" + err.message);
    } finally {
        setSending(false);
    }
    };

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            sx={{ mr: 1 }}
            onClick={() => navigate(-1)}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            忘記密碼
          </Typography>

          <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} />
          <AboutDialog />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm">
        <ForgotPaper elevation={3}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            忘記密碼
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            我們會寄送一封「重設密碼」連結到你的帳號信箱。
          </Typography>

          {/* ✅ 信箱僅顯示、不允許修改 */}
          <TextField
            fullWidth
            type="email"
            label="電子郵件"
            value={email}
            disabled
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
    </>
  );
}
