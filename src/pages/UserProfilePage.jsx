// src/pages/UserProfilePage.jsx
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
import { styled } from "@mui/material/styles";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LogoutIcon from "@mui/icons-material/Logout";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";

import { auth, db } from "../firebase";
import {
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

import ThemeToggle from "../components/ThemeToggle";
import AboutDialog from "../components/About";

const ProfilePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 500,
  margin: "24px auto",
}));

export default function UserProfilePage({ themeMode, toggleTheme }) {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState("");

  // 密碼修改
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // 刪除帳號
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deleteCurrentPassword, setDeleteCurrentPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    setDisplayName(user.displayName || "未命名使用者");
    setEmail(user.email || "");

    // 從 Firestore 補一次名稱 / email（如果有 users/{uid}）
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.name) setDisplayName(data.name);
          if (data.email) setEmail(data.email);
        }
      } catch (err) {
        console.warn("讀取使用者 Firestore 資料失敗：", err);
      }
    })();
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  // 共用：用目前密碼 re-auth
  const reauthWithPassword = async (currentPassword) => {
    const cred = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, cred);
  };

  // ✅ 儲存名稱（不用密碼）
  const handleSaveName = async () => {
    setNameMessage("");
    setNameSaving(true);
    try {
      const trimmed = displayName.trim() || "未命名使用者";

      // 更新 Auth displayName
      await updateProfile(user, { displayName: trimmed });

      // Firestore 同步（如果 users/{uid} 存在）
      try {
        await updateDoc(doc(db, "users", user.uid), {
          name: trimmed,
        });
      } catch (err) {
        console.warn("更新 Firestore 名稱失敗，可忽略：", err);
      }

      setNameMessage("名稱已更新");
      setEditingName(false);
    } catch (err) {
      console.error(err);
      setNameMessage("更新名稱失敗：" + err.message);
    } finally {
      setNameSaving(false);
    }
  };

  // ✅ 更新密碼（需原密碼 + 新密碼）
  const handleSavePassword = async () => {
    setPasswordMessage("");
    if (!passwordCurrentPassword || !newPassword) {
      setPasswordMessage("請輸入目前密碼與新密碼");
      return;
    }

    setPasswordSaving(true);
    try {
      await reauthWithPassword(passwordCurrentPassword);
      await updatePassword(user, newPassword);

      setPasswordMessage("密碼已更新");
      setPasswordCurrentPassword("");
      setNewPassword("");
      setShowPasswordSection(false);   // ✅ 成功後收起區塊
    } catch (err) {
      console.error(err);
      setPasswordMessage("更新密碼失敗：" + err.message);
    } finally {
      setPasswordSaving(false);
    }
  };


  // ✅ 刪除帳號（需原密碼）
  const handleDeleteAccount = async () => {
    setDeleteMessage("");
    if (!deleteCurrentPassword) {
      setDeleteMessage("請輸入目前的密碼以確認刪除帳號");
      return;
    }

    if (!window.confirm("確定要刪除帳號嗎？此動作無法復原。")) return;

    setDeleting(true);
    try {
      await reauthWithPassword(deleteCurrentPassword);

      try {
        await deleteDoc(doc(db, "users", user.uid));
      } catch (err) {
        console.warn("刪除 Firestore 使用者資料失敗，可忽略：", err);
      }

      await deleteUser(user);
      setDeleteMessage("帳號已刪除");
      navigate("/");
    } catch (err) {
      console.error(err);
      setDeleteMessage("刪除帳號失敗：" + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const safeName = displayName || "未命名使用者";

  return (
    <>
      {/* 上方 Bar：和其他頁一致 */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          bgcolor: (theme) => theme.palette.background.default, // 整頁背景跟隨 theme
        }}
      >
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              sx={{ mr: 1 }}
              onClick={() => navigate("/maps")}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="body2"
              sx={{ mr: 2, cursor: "pointer" }}
              onClick={() => navigate("/maps")}
            >
              回地圖列表
            </Typography>

            <Typography variant="h6" sx={{ flexGrow: 1 }}>
            </Typography>

            <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} />
            <AboutDialog />

            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* 主要內容 */}
        <Container maxWidth="sm">
          <ProfilePaper elevation={3}>
            {/* 標題區 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  使用者資訊
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  管理你的帳號名稱與安全設定
                </Typography>
              </Box>
            </Box>

            {/* 使用者名稱 row */}
            <Box sx={{ mb: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ minWidth: 90 }}
                >
                  使用者名稱：
                </Typography>

                {editingName ? (
                  <TextField
                    size="small"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    sx={{ flex: 1, ml: 1.5 }}
                  />
                ) : (
                  <Typography variant="body1" sx={{ flex: 1, ml: 1.5 }}>
                    {safeName}
                  </Typography>
                )}

                <IconButton
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => {
                    if (editingName) {
                      if (!nameSaving) handleSaveName(); // 勾勾：儲存
                    } else {
                      setEditingName(true); // 筆：進入編輯
                      setNameMessage("");
                    }
                  }}
                >
                  {editingName ? (
                    <CheckIcon fontSize="small" />
                  ) : (
                    <EditIcon fontSize="small" />
                  )}
                </IconButton>
              </Box>

              {nameMessage && (
                <Alert
                  severity={nameMessage.includes("失敗") ? "error" : "success"}
                  sx={{ mt: 1 }}
                >
                  {nameMessage}
                </Alert>
              )}
            </Box>

            {/* 電子郵件 row */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ minWidth: 90 }}
                >
                  電子郵件：
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ flex: 1, ml: 1.5, wordBreak: "break-all" }}
                >
                  {email}
                </Typography>
              </Box>
            </Box>

            {/* 操作按鈕區：變更密碼 + 忘記密碼 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Button
                variant="contained"
                onClick={() => setShowPasswordSection((prev) => !prev)}
              >
                變更密碼
              </Button>

              <Button
                variant="outlined"
                onClick={() => navigate("/forgot-password")}
              >
                忘記密碼
              </Button>
            </Box>

            {/* 變更密碼區塊 */}
            {showPasswordSection && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light"
                      ? theme.palette.grey[50]
                      : "rgba(255,255,255,0.02)",
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                  變更密碼
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  label="目前密碼"
                  value={passwordCurrentPassword}
                  onChange={(e) => setPasswordCurrentPassword(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="新密碼"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ mb: 1.5 }}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSavePassword}
                    disabled={passwordSaving}
                  >
                    儲存密碼
                  </Button>
                </Box>
                {passwordMessage && (
                  <Alert
                    severity={
                      passwordMessage.includes("失敗") ? "error" : "success"
                    }
                    sx={{ mt: 1 }}
                  >
                    {passwordMessage}
                  </Alert>
                )}
              </Box>
            )}

            {/* 刪除帳號 */}
            <Box
              sx={{
                mt: 1,
                pt: 2,
                borderTop: (theme) => `1px dashed ${theme.palette.divider}`,
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                color="error"
                sx={{ mb: 1.5 }}
                onClick={() => setShowDeleteSection((prev) => !prev)}
              >
                刪除帳號
              </Button>

              {showDeleteSection && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.error.light}`,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "light"
                        ? "rgba(244, 67, 54, 0.04)"
                        : "rgba(244, 67, 54, 0.12)",
                  }}
                >
                  <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                    確認刪除帳號
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    此動作無法復原，請輸入目前密碼以確認。
                  </Typography>
                  <TextField
                    fullWidth
                    type="password"
                    label="目前密碼"
                    value={deleteCurrentPassword}
                    onChange={(e) => setDeleteCurrentPassword(e.target.value)}
                    sx={{ mb: 1.5 }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="error"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      確認刪除帳號
                    </Button>
                  </Box>
                  {deleteMessage && (
                    <Alert
                      severity={
                        deleteMessage.includes("失敗") ? "error" : "warning"
                      }
                      sx={{ mt: 1 }}
                    >
                      {deleteMessage}
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </ProfilePaper>

        </Container>
      </Box>
    </>
  );
}
