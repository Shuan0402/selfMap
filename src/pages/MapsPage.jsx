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
  updateDoc 
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
  Menu,
  MenuItem,
  Snackbar
} from "@mui/material";
import { 
  Add as AddIcon, 
  Logout as LogoutIcon, 
  Map as MapIcon, 
  MoreVert as MoreVertIcon 
} from "@mui/icons-material";

export default function MapsPage({ user }) {
  const [maps, setMaps] = useState([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "maps"), where("ownerUid", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setMaps(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

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
      setTitle("");
      setOpenDialog(false);
      navigate(`/map/${docRef.id}`);
    } catch (err) {
      setError("建立失敗: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setTitle("");
    setError("");
  };

  const handleCloseDialog = () => {
    if (!creating) {
      setOpenDialog(false);
    }
  };

  // 處理三點選單開啟
  const handleMenuOpen = (event, map) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMap(map);
  };

  // 處理三點選單關閉
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMap(null);
  };

  // 刪除地圖
  const handleDeleteMap = async () => {
    try {
      await deleteDoc(doc(db, "maps", selectedMap.id));
      setSnackbar({ open: true, message: "地圖已刪除", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: "刪除失敗: " + error.message, severity: "error" });
    }
    handleMenuClose();
  };

  // 分享地圖
  const handleShareMap = () => {
    // 這裡可以實現分享邏輯，例如複製連結到剪貼簿
    const mapUrl = `${window.location.origin}/map/${selectedMap.id}`;
    navigator.clipboard.writeText(mapUrl)
      .then(() => {
        setSnackbar({ open: true, message: "地圖連結已複製到剪貼簿", severity: "success" });
      })
      .catch(() => {
        setSnackbar({ open: true, message: "無法複製連結", severity: "error" });
      });
    handleMenuClose();
  };

  // 開啟重新命名對話框
  const handleRenameClick = () => {
    setNewMapName(selectedMap.title || "");
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  // 重新命名地圖
  const handleRenameMap = async () => {
    if (!newMapName.trim()) {
      setSnackbar({ open: true, message: "請輸入有效的地圖名稱", severity: "error" });
      return;
    }

    try {
      await updateDoc(doc(db, "maps", selectedMap.id), {
        title: newMapName.trim()
      });
      setSnackbar({ open: true, message: "地圖名稱已更新", severity: "success" });
      setRenameDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: "更新失敗: " + error.message, severity: "error" });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "grey.100" }}>
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

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" component="h2">
              地圖列表
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
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
                    <IconButton
                      edge="end"
                      aria-label="more"
                      onClick={(e) => handleMenuOpen(e, map)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton component={Link} to={`/map/${map.id}`}>
                    <ListItemText
                      primary={map.title || "(未命名地圖)"}
                      secondary={`創建時間: ${map.createdAt?.toDate().toLocaleString() || "未知"}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Container>

      {/* 新增地圖對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
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
          <Button onClick={handleCloseDialog} disabled={creating}>
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

      {/* 三點功能選單 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRenameClick}>重新命名地圖</MenuItem>
        <MenuItem onClick={handleShareMap}>分享地圖</MenuItem>
        <MenuItem onClick={handleDeleteMap}>刪除地圖</MenuItem>
      </Menu>

      {/* 重新命名對話框 */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>重新命名地圖</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="地圖名稱"
            type="text"
            fullWidth
            variant="outlined"
            value={newMapName}
            onChange={(e) => setNewMapName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRenameMap();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleRenameMap}
            variant="contained"
          >
            確認
          </Button>
        </DialogActions>
      </Dialog>

      {/* 訊息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}