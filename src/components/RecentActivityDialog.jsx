// src/components/RecentActivityDialog.jsx
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";

import HistoryIcon from "@mui/icons-material/History";
import EditIcon from "@mui/icons-material/Edit";
import PersonIcon from "@mui/icons-material/Person";
import PlaceIcon from "@mui/icons-material/Place";
import DeleteIcon from "@mui/icons-material/Delete";

import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  writeBatch,
} from "firebase/firestore";

function iconForType(type) {
  switch (type) {
    case "rename_user":
      return <PersonIcon fontSize="small" />;
    case "edit_marker":
    case "edit_marker_note":
    case "edit_marker_meta":
      return <EditIcon fontSize="small" />;
    case "delete_marker":
      return <DeleteIcon fontSize="small" />;
    case "create_marker":
      return <PlaceIcon fontSize="small" />;
    default:
      return <HistoryIcon fontSize="small" />;
  }
}

export default function RecentActivityDialog({ open, onClose, userId }) {
  const [activities, setActivities] = useState([]);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    const q = query(
      collection(db, "users", userId, "activities"),
      orderBy("createdAt", "desc"),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setActivities(list);
    });

    return () => unsub();
  }, [open, userId]);

  const handleClear = async () => {
    if (!userId) return;
    if (activities.length === 0) return;

    const confirm = window.confirm("確定要清空所有活動紀錄嗎？此操作無法復原。");
    if (!confirm) return;

    try {
      setClearing(true);

      const colRef = collection(db, "users", userId, "activities");
      const snap = await getDocs(colRef); // 清整個 activities 子集合

      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
      // onSnapshot 會自動把 activities 更新為空陣列
    } catch (err) {
      console.error("清空活動紀錄失敗:", err);
      alert("清空活動紀錄時發生錯誤，請稍後再試。");
    } finally {
      setClearing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="h6">最近消息</Typography>

        {activities.length > 0 && (
          <Tooltip title="清空紀錄">
            <span>
              {/* span 用來避免 disabled 時 Tooltip 失效 */}
              <IconButton
                size="small"
                color="error"
                onClick={handleClear}
                disabled={clearing}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            目前沒有任何活動記錄。
          </Typography>
        ) : (
          <List>
            {activities.map((act) => {
              const timeText = act.createdAt?.toDate
                ? act.createdAt.toDate().toLocaleString()
                : "";

              return (
                <ListItem key={act.id} alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {iconForType(act.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Typography variant="body1">
                          {act.message}
                        </Typography>
                        {timeText && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {timeText}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      act.detail ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {act.detail}
                        </Typography>
                      ) : null
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
