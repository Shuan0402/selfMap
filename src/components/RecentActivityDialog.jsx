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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>最近消息</DialogTitle>
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
