// src/pages/ResetPasswordPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

import ThemeToggle from "../components/ThemeToggle";
import AboutDialog from "../components/About";

const ResetPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 480,
  margin: "24px auto",
}));

// 取得 query string
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPasswordPage({ themeMode, toggleTheme }) {
  const navigate = useNavigate();
  const query = useQuery();
  const [oobCode, setOobCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState("");

    useEffect(() => {
        const code = query.get("oobCode");

        if (!code) {
            setChecking(false);
            setValid(false);
            setMessage("連結無效，缺少驗證碼。");
            return;
        }

        setOobCode(code);

        (async () => {
            try {
            await verifyPasswordResetCode(auth, code);
            setValid(true);
            } catch (err) {
            console.error(err);
            setMessage("驗證碼無效或已過期：" + err.message);
            setValid(false);
            } finally {
            setChecking(false);
            }
        })();
        }, [query]);

  const handleConfirmReset = async () => {
    setMessage("");
    if (!newPassword) {
      setMessage("請輸入新密碼");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("密碼已重設，請重新登入。");
    } catch (err) {
      console.error(err);
      setMessage("重設密碼失敗：" + err.message);
    }
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            sx={{ mr: 1 }}
            onClick={() => navigate("/")}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            重設密碼
          </Typography>

          <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} />
          <AboutDialog />
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm">
        <ResetPaper elevation={3}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            重設密碼
          </Typography>

          {checking ? (
            <Typography variant="body2">驗證連結中，請稍候...</Typography>
          ) : !valid ? (
            <Alert severity="error">{message || "連結無效。"}</Alert>
          ) : (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                請輸入新的密碼。
              </Typography>

              <TextField
                fullWidth
                type="password"
                label="新密碼"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="contained" onClick={handleConfirmReset}>
                  確認重設密碼
                </Button>
              </Box>

              {message && (
                <Alert
                  severity={
                    message.includes("失敗") ? "error" : "success"
                  }
                  sx={{ mt: 2 }}
                >
                  {message}
                </Alert>
              )}
            </>
          )}
        </ResetPaper>
      </Container>
    </>
  );
}
