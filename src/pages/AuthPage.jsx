import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
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
  Divider
} from "@mui/material";
import { styled } from "@mui/material/styles";

// 樣式組件
const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: 400,
  margin: "0 auto"
}));

const Form = styled("form")(({ theme }) => ({
  width: "100%",
  marginTop: theme.spacing(3)
}));

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2)
}));

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleModeChange = (event, newValue) => {
    setMode(newValue);
    setError(""); // 切換模式時清除錯誤
  };

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/maps");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <AuthPaper elevation={6}>
          <Typography component="h1" variant="h4" gutterBottom>
            SelfMap
          </Typography>
          
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
            <SubmitButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
            >
              {mode === "signin" ? "登入" : "建立帳號"}
            </SubmitButton>
            
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