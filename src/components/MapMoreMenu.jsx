// src/components/MapMoreMenu.jsx
import { useState } from "react";
import {
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete as DeleteIcon, CleaningServices as CleaningIcon } from "@mui/icons-material";

export default function MapMoreMenu({
  anchorEl,
  onClose,
  map,
  onRename,
  onDelete,
  onShare,
  onClearMarkers,
}) {
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newMapName, setNewMapName] = useState(map?.title || "");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clearMarkersConfirmOpen, setClearMarkersConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 開啟重新命名對話框
  const handleRenameClick = () => {
    setNewMapName(map?.title || "");
    setRenameDialogOpen(true);
    onClose();
  };

  const handleRenameConfirm = async () => {
    if (!newMapName.trim()) {
      setSnackbar({ open: true, message: "請輸入有效名稱", severity: "error" });
      return;
    }
    if (!map?.id || !onRename) {
      setSnackbar({ open: true, message: "操作失敗：資料不完整", severity: "error" });
      return;
    }
    try {
      await onRename(map.id, newMapName.trim());
      setSnackbar({ open: true, message: "名稱已更新", severity: "success" });
      setRenameDialogOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: "更新失敗: " + err.message, severity: "error" });
    }
  };

  // 分享
  const handleShareClick = async () => {
    try {
      const shareUrl = `${window.location.origin}/selfMap/map/${map.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setSnackbar({ open: true, message: "連結已複製", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "無法複製連結", severity: "error" });
    }
    onClose();
  };

  // 刪除
  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
    onClose();
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete(map.id);
      setSnackbar({ open: true, message: "已刪除", severity: "success" });
      setDeleteConfirmOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: "刪除失敗: " + err.message, severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  // --- 清空所有標記 ---
  const handleClearMarkersClick = () => {
    setClearMarkersConfirmOpen(true);
    onClose();
  };

  const handleClearMarkersConfirm = async () => {
    if (!onClearMarkers) {
      setSnackbar({ open: true, message: "清空功能未提供", severity: "error" });
      return;
    }
    setClearing(true);
    try {
      await onClearMarkers(map.id);
      setSnackbar({ open: true, message: "已清空所有地標", severity: "success" });
      setClearMarkersConfirmOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: "清空失敗: " + err.message, severity: "error" });
    } finally {
      setClearing(false);
    }
  };


  return (
    <>
      {/* 功能選單 */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
        <MenuItem onClick={handleRenameClick}>重新命名</MenuItem>
        <MenuItem onClick={handleShareClick}>分享</MenuItem>
        <MenuItem onClick={handleClearMarkersClick}>清空地標</MenuItem>
        <MenuItem onClick={handleDeleteClick}>刪除</MenuItem>
      </Menu>

      {/* 重新命名對話框 */}
      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>重新命名地圖</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="新名稱"
            value={newMapName}
            onChange={(e) => setNewMapName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>取消</Button>
          <Button onClick={handleRenameConfirm} variant="contained">
            確認
          </Button>
        </DialogActions>
      </Dialog>

      {/* 清空地標確認對話框 */}
      <Dialog open={clearMarkersConfirmOpen} onClose={() => !clearing && setClearMarkersConfirmOpen(false)}>
        <DialogTitle>清空地標</DialogTitle>
        <DialogContent>
          <Typography>確定要清空「{map?.title || "未命名地圖"}」中的所有地標嗎？</Typography>
          <Typography variant="body2" color="error">此操作無法復原。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearMarkersConfirmOpen(false)} disabled={clearing}>
            取消
          </Button>
          <Button
            onClick={handleClearMarkersConfirm}
            color="warning"
            startIcon={clearing ? <CircularProgress size={16} /> : <CleaningIcon />}
            disabled={clearing}
          >
            {clearing ? "清空中..." : "清空"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteConfirmOpen} onClose={() => !deleting && setDeleteConfirmOpen(false)}>
        <DialogTitle>刪除地圖</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除「{map?.title || "未命名地圖"}」嗎？
          </Typography>
          <Typography variant="body2" color="error">
            此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>
            取消
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            disabled={deleting}
          >
            {deleting ? "刪除中..." : "刪除"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
