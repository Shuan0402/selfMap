// src/components/MarkerPopupCard.jsx
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function MarkerPopupCard({
  marker,
  onCopyAddress,
  onDelete,
  isDeleting,
  onImageClick,
}) {
  return (
    <Card sx={{ maxWidth: 300 }}>
      {marker.photoBase64 && (
        <CardMedia
          component="img"
          height="140"
          image={marker.photoBase64}
          alt="地點照片"
          sx={{ cursor: "pointer" }}
          onClick={() => onImageClick(marker.photoBase64)}
        />
      )}

      <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flex: 1, overflowWrap: "anywhere" }}
        >
          {marker.address}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onCopyAddress(marker.address)}
          aria-label="複製地址"
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </CardContent>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          pb: 1,
        }}
      >
        {marker.createdAt?.toDate && (
          <Chip
            icon={<LocationOnIcon />}
            label={marker.createdAt.toDate().toLocaleString()}
            size="small"
            variant="outlined"
          />
        )}

        <IconButton
          aria-label="刪除地標"
          onClick={onDelete}
          disabled={isDeleting}
          size="small"
          color="error"
        >
          {isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
        </IconButton>
      </Box>
    </Card>
  );
}
