import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Logout as LogoutIcon,
  Map as MapIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

import MapMoreMenu from "../components/MapMoreMenu";

export default function MapsPage({ user }) {
  const [maps, setMaps] = useState([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState("");

  // 三點選單控制
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
    await updateDoc(doc(db, "maps", id), { title: newName });
    setMaps((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title: newName } : m))
    );
  };

  const handleDeleteMap = async (id) => {
    await deleteDoc(doc(db, "maps", id));
    setMaps((prev) => prev.filter((m) => m.id !== id));
  };

  const handleShareMap = async (id) => {
    const url = `${window.location.origin}/map/${id}`;
    return navigator.clipboard.writeText(url);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "grey.100" }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <MapIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            我的地圖
          </Typography>
          <IconButton color="inherit" onClick={() => signOut(auth)}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 主內容 */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
          >
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
              <MapIcon sx={{ fontSize: 60, color: "grey.400", mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                還沒有地圖 — 建立一個吧！
              </Typography>
            </Box>
          ) : (
            <List sx={{ bgcolor: "background.paper" }}>
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
                          ? map.createdAt.toDate().toLocaleString()
                          : new Date(map.createdAt).toLocaleString() || "未知"
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
      <Dialog open={openDialog} onClose={() => !creating && setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>建立新地圖</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="地圖名稱"
            type="text"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                createMap();
              }
            }}
            disabled={creating}
            sx={{ mt: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={creating}>
            取消
          </Button>
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
        />
      )}
    </Box>
  );
}
