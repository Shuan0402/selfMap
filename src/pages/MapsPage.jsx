import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";  // 加入 Link 的導入
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Add as AddIcon, MoreVert as MoreVertIcon } from "@mui/icons-material";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import MapMoreMenu from "../components/MapMoreMenu";
import AppTopBar from "../components/AppTopBar";
import LandingPageBackground from "../components/LandingPageBackground";  // 背景組件

export default function MapsPage({ user, themeMode, toggleTheme }) {
  const [maps, setMaps] = useState([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "maps"),
      where("ownerUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) =>
      setMaps(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [user]);

  const handleStart = () => {
    if (user) {
      navigate("/maps");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("登出失敗：", err);
    }
  };

  // 建立新地圖
  async function createMap() {
    if (!title.trim()) {
      setError("請輸入地圖名稱");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const docRef = await addDoc(collection(db, "maps"), {
        title: title.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
      const newMap = {
        id: docRef.id,
        title: title.trim(),
        ownerUid: user.uid,
        createdAt: new Date(),
      };

      setMaps((prevMaps) => [newMap, ...prevMaps]);
      setTitle("");
      setOpenDialog(false);
    } catch (err) {
      setError("建立失敗: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  // 三點選單開關
  const handleMenuOpen = (event, map) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedMap(map);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // 提供給 MapMoreMenu 的動作
  const handleRenameMap = async (id, newName) => {
    await renameMap(id, newName);
    setMaps((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title: newName } : m))
    );
  };

  const handleDeleteMap = async (id) => {
    await deleteMap(id);
    setMaps((prev) => prev.filter((m) => m.id !== id));
  };

  const handleShareMap = async (id) => {
    await shareMap(id);
  };

  const handleClearMarkers = async (mapId) => {
    try {
      await clearMarkers(mapId);
    } catch (err) {
      console.error("handleClearMarkers error:", err);
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

      {/* AppBar */}
      <Box sx={{ position: "relative", zIndex: 2 }}>
        <AppTopBar
          variant="maps"
          themeMode={themeMode}
          toggleTheme={toggleTheme}
          userName={user?.displayName || "未命名使用者"}
          onLogout={handleLogout}
        />
      </Box>

      {/* 主內容 */}
      <Container maxWidth="md" sx={{ py: 4, position: "relative", zIndex: 2 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h5" component="h2">
              地圖列表
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setOpenDialog(true);
                setTitle("");
                setError("");
              }}
            >
              新增地圖
            </Button>
          </Box>

          {maps.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                還沒有地圖 — 建立一個吧！
              </Typography>
            </Box>
          ) : (
            <List>
              {maps.map((map) => (
                <ListItem
                  key={map.id}
                  disablePadding
                  divider
                  secondaryAction={
                    <IconButton edge="end" onClick={(e) => handleMenuOpen(e, map)}>
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton component={Link} to={`/map/${map.id}`}>
                    <ListItemText
                      primary={map.title || "(未命名地圖)"}
                      secondary={`創建時間: ${
                        map.createdAt?.toDate
                          ? map.createdAt.toDate().toLocaleString()        // Firestore Timestamp
                          : map.createdAt instanceof Date
                          ? map.createdAt.toLocaleString()                // 原生 Date（你在 createMap 裡 new Date() 的那個）
                          : "未知"
                      }`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>

      {/* 新增地圖對話框 */}
      <Dialog open={openDialog} onClose={() => !creating && setOpenDialog(false)}>
        <DialogTitle>建立新地圖</DialogTitle>
        <DialogContent>
          <TextField
            label="地圖名稱"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            disabled={creating}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={creating}>取消</Button>
          <Button
            onClick={createMap}
            disabled={creating || !title.trim()}
            variant="contained"
            startIcon={creating ? <CircularProgress size={16} /> : null}
          >
            {creating ? "建立中..." : "建立"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 三點功能模組化元件 */}
      {selectedMap && (
        <MapMoreMenu
          anchorEl={menuAnchorEl}
          onClose={handleMenuClose}
          map={selectedMap}
          onRename={handleRenameMap}
          onDelete={handleDeleteMap}
          onShare={handleShareMap}
          onClearMarkers={handleClearMarkers}
        />
      )}
    </Box>
  );
}
