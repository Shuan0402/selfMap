// src/pages/AuthPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import {
  Container,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ThemeToggle from "../components/ThemeToggle";

// 樣式組件
const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: 400,
  margin: "0 auto",
}));

const Form = styled("form")(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(3),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

export default function AuthPage({ themeMode, toggleTheme }) {
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(""); // 使用者名稱
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleModeChange = (event, newValue) => {
    setMode(newValue);
    setError("");
  };

  async function handleAuth(e) {
    e.preventDefault();
    setError("");

    try {
      if (mode === "signup") {
        // 註冊流程
        if (!displayName.trim()) {
          setError("請輸入使用者名稱");
          return;
        }

        const cred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // 設定 Firebase Auth 的 displayName
        await updateProfile(cred.user, {
          displayName: displayName.trim(),
        });

        // 同步一份到 Firestore users/{uid}
        await setDoc(doc(db, "users", cred.user.uid), {
          name: displayName.trim(),
          email: email.trim(),
          createdAt: serverTimestamp(),
        });
      } else {
        // 登入流程
        await signInWithEmailAndPassword(auth, email, password);
      }

      navigate("/maps");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  // 🔗 忘記密碼導向
  const handleForgotPassword = () => {
    navigate("/forgot-password"); // 這裡路徑要和你的 Router 設定一致
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <AuthPaper elevation={6}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              mb: 2,
            }}
          >
            <Typography component="h1" variant="h4">
              SelfMap
            </Typography>
            <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} />
          </Box>

          <Tabs
            value={mode}
            onChange={handleModeChange}
            variant="fullWidth"
            sx={{ width: "100%", mb: 3 }}
          >
            <Tab label="登入" value="signin" />
            <Tab label="註冊" value="signup" />
          </Tabs>

          <Form onSubmit={handleAuth}>
            {/* 註冊模式下顯示使用者名稱欄位 */}
            {mode === "signup" && (
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="displayName"
                label="使用者名稱"
                name="displayName"
                autoComplete="nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}

            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="電子郵件"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="密碼"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* ✅ 只有在「登入」模式時顯示「忘記密碼？」 */}
            {mode === "signin" && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  mt: 1,
                }}
              >
                <Button
                  size="small"
                  color="primary"
                  onClick={handleForgotPassword}
                >
                  忘記密碼？
                </Button>
              </Box>
            )}

            <SubmitButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
            >
              {mode === "signin" ? "登入" : "建立帳號"}
            </SubmitButton>

            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              sx={{ mt: 2 }}
            >
              © {new Date().getFullYear()} Shuan Ho. All rights reserved.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Form>
        </AuthPaper>
      </Box>
    </Container>
  );
}
