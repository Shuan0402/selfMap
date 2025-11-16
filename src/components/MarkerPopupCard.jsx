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

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

export default function MarkerPopupCard({
  marker,
  onCopyAddress,
  onDelete,
  isDeleting,
  onImageClick,
  onOpenInGoogleMaps,
  currentUserUid,
}) {
  const createdAtText =
    marker.createdAt?.toDate?.().toLocaleString() ?? "";

  const isOwner =
    marker.createdBy && currentUserUid
      ? marker.createdBy === currentUserUid
      : false;

  const comments = Array.isArray(marker.comments)
    ? marker.comments
    : [];

  return (
    <Card sx={{ maxWidth: 320 }}>
      {/* 標題 */}
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {marker.title || "未命名地標"}
        </Typography>
      </CardContent>

      {/* 照片 */}
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

      {/* 地址 + 複製 */}
      <CardContent
        sx={{ display: "flex", alignItems: "center", gap: 1, pb: 1 }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flex: 1, wordBreak: "break-word" }}
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

      {/* 備註（只有作者本人會看到） */}
      {marker.note && isOwner && (
        <CardContent sx={{ pt: 0, pb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            備註（只有你自己看得到）：{marker.note}
          </Typography>
        </CardContent>
      )}

      {/* 時間 + Google Maps 導航 + 刪除 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* 上傳時間，用時鐘 icon */}
          {createdAtText && (
            <Chip
              icon={<AccessTimeIcon />}  // ⬅ 這裡是時鐘
              label={createdAtText}
              size="small"
              variant="outlined"
            />
          )}

          {/* 導航按鈕：圖釘 icon 負責開 Google Maps */}
          <IconButton
            size="small"
            color="primary"
            aria-label="在 Google Maps 打開導航"
            onClick={() => onOpenInGoogleMaps(marker)}
          >
            <LocationOnIcon />  {/* ⬅ 這顆就是你說的「原本圖釘」 */}
          </IconButton>
        </Box>

        {/* 刪除按鈕 */}
        <IconButton
          aria-label="刪除地標"
          onClick={onDelete}
          disabled={isDeleting}
          size="small"
          color="error"
        >
          {isDeleting ? (
            <CircularProgress size={16} />
          ) : (
            <DeleteIcon />
          )}
        </IconButton>
      </Box>

      {/* 評論區（目前只顯示，新增評論我們可以下一步再做） */}
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          評論
        </Typography>

        {comments.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            還沒有任何評論。
          </Typography>
        )}

        {comments.map((c, idx) => (
          <Box key={idx} sx={{ mb: 0.5 }}>
            <Typography variant="body2">
              <strong>{c.authorName || "匿名"}</strong>：{c.text}
            </Typography>
            {c.createdAt?.toDate && (
              <Typography variant="caption" color="text.secondary">
                {c.createdAt.toDate().toLocaleString()}
              </Typography>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
