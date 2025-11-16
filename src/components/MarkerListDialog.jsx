// src/components/MarkerListDialog.jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
} from "@mui/material";

import PlaceIcon from "@mui/icons-material/Place";

export default function MarkerListDialog({
  open,
  onClose,
  markers,
  onSelectMarker,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>地標列表</DialogTitle>
      <DialogContent dividers>
        {(!markers || markers.length === 0) && (
          <Typography variant="body2" color="text.secondary">
            目前地圖中沒有任何地標。
          </Typography>
        )}

        {markers && markers.length > 0 && (
          <List>
            {markers.map((m) => {
              const title = m.title || "未命名地標";
              const address = m.address || "";
              const createdAtText = m.createdAt?.toDate?.().toLocaleString?.() ?? "";

              return (
                <ListItemButton
                  key={m.id}
                  onClick={() => {
                    onSelectMarker(m);
                  }}
                  sx={{ alignItems: "flex-start" }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PlaceIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {title}
                        </Typography>
                        {createdAtText && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            {createdAtText}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-line" }}
                      >
                        {address}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
