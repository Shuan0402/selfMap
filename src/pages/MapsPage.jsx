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
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

export default function MapsPage({ user }) {
  const [maps, setMaps] = useState([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [error, setError] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMapId, setSelectedMapId] = useState(null);
  const [selectedMapTitle, setSelectedMapTitle] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      
      // 手動添加新地圖到本地狀態
      const newMap = {
        id: docRef.id,
        title: title.trim(),
        ownerUid: user.uid,
        createdAt: new Date() // 使用本地時間作為暫時值
      };
      
      setMaps(prevMaps => [newMap, ...prevMaps]);
      setTitle("");
      setOpenDialog(false);
      
      // 顯示成功消息
      setSnackbar({ open: true, message: "地圖建立成功", severity: "success" });
      
      // 不再立即導航到新地圖
      // navigate(`/map/${docRef.id}`);
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
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedMapId(map.id);
    setSelectedMapTitle(map.title || "");
  };

  // 處理三點選單關閉
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // 開啟刪除確認對話框
  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  // 刪除地圖
  const handleDeleteMap = async () => {
    if (!selectedMapId) {
      setSnackbar({ open: true, message: "未選擇地圖", severity: "error" });
      setDeleteConfirmOpen(false);
      return;
    }
    
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "maps", selectedMapId));
      // 從本地狀態中移除地圖
      setMaps(prevMaps => prevMaps.filter(map => map.id !== selectedMapId));
      setSnackbar({ open: true, message: "地圖已刪除", severity: "success" });
      setDeleteConfirmOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: "刪除失敗: " + error.message, severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // 分享地圖
  const handleShareMap = () => {
    if (!selectedMapId) {
      setSnackbar({ open: true, message: "未選擇地圖", severity: "error" });
      handleMenuClose();
      return;
    }
    
    const mapUrl = `${window.location.origin}/map/${selectedMapId}`;
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
    setNewMapName(selectedMapTitle);
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  // 重新命名地圖
  const handleRenameMap = async () => {
    if (!selectedMapId) {
      setSnackbar({ open: true, message: "未選擇地圖", severity: "error" });
      setRenameDialogOpen(false);
      return;
    }
    
    if (!newMapName.trim()) {
      setSnackbar({ open: true, message: "請輸入有效的地圖名稱", severity: "error" });
      return;
    }

    try {
      await updateDoc(doc(db, "maps", selectedMapId), {
        title: newMapName.trim()
      });
      
      // 更新本地狀態中的地圖名稱
      setMaps(prevMaps => 
        prevMaps.map(map => 
          map.id === selectedMapId ? { ...map, title: newMapName.trim() } : map
        )
      );
      
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
                      secondary={`創建時間: ${map.createdAt?.toDate ? map.createdAt.toDate().toLocaleString() : new Date(map.createdAt).toLocaleString() || "未知"}`}
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
        <MenuItem onClick={handleDeleteClick}>刪除地圖</MenuItem>
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

      {/* 刪除確認對話框 */}
      <Dialog open={deleteConfirmOpen} onClose={() => !deleting && setDeleteConfirmOpen(false)}>
        <DialogTitle>刪除地圖</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            確定要刪除地圖 "{selectedMapTitle || '未命名地圖'}" 嗎？
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            此操作將永久刪除此地圖及其所有標記，無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            disabled={deleting}
          >
            取消
          </Button>
          <Button 
            onClick={handleDeleteMap} 
            color="error" 
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? "刪除中..." : "刪除"}
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