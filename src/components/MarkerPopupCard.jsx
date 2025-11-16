// src/components/MarkerPopupCard.jsx
import { useState, useEffect } from "react";

import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  CircularProgress,
  TextField,
  Button,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";


import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";

export default function MarkerPopupCard({
  marker,
  currentUserUid,
  onCopyAddress,
  onDelete,
  isDeleting,
  onImageClick,
  onOpenInGoogleMaps,
  // 評論
  commentInput,
  onCommentInputChange,
  onAddComment,
  // 備註
  noteInput,
  onNoteInputChange,
  onSaveNote,
  // 編輯標題 / 地址
  onUpdateMeta,
}) {
    const isOwner =
    (currentUserUid && !marker.createdBy) ||  // 有登入，而且資料沒 createdBy
    (currentUserUid && marker.createdBy === currentUserUid);



  const comments = Array.isArray(marker.comments)
    ? marker.comments
    : [];

  const createdAtText =
    marker.createdAt?.toDate?.().toLocaleString() ?? "";

  // 編輯模式本地 state
  const [editing, setEditing] = useState(false);
  const [noteEditing, setNoteEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(marker.title || "未命名地標");
  const [localAddress, setLocalAddress] = useState(
    marker.address || ""
  );

  // marker 改變時同步本地值
  useEffect(() => {
    setLocalTitle(marker.title || "未命名地標");
    setLocalAddress(marker.address || "");
  }, [marker.title, marker.address]);

  useEffect(() => {
    // 備註在外面被更新時，把編輯狀態關掉
    setNoteEditing(false);
    }, [marker.note]);


  const handleEditClick = () => {
    if (!isOwner) return;
    setEditing((prev) => !prev);
  };

  const handleSaveMeta = () => {
    if (!isOwner) {
      setEditing(false);
      return;
    }
    onUpdateMeta({
      title: localTitle.trim() || "未命名地標",
      address: localAddress.trim(),
    });
    setEditing(false);
  };

  // 取得目前使用者的評論（若有）
    const userComment = comments.find(
    (c) => c.authorUid === currentUserUid
    );


  return (
    <Card sx={{ width: "100%" }}>

      {/* 標題 + 編輯按鈕 */}
      <CardContent sx={{ pb: 1, display: "flex", alignItems: "center" }}>
        {editing ? (
          <TextField
            variant="standard"
            fullWidth
            label="標題"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
          />
        ) : (
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, flex: 1 }}
          >
            {marker.title || "未命名地標"}
          </Typography>
        )}

        {/* 編輯 / 儲存按鈕 */}
        {isOwner && (
        <IconButton
            size="small"
            onClick={(e) => {
            e.stopPropagation();

            if (editing) {
                handleSaveMeta();
            } else {
                setEditing(true);
            }
            }}
            aria-label={editing ? "儲存地標" : "編輯地標"}
        >
            {editing ? (
            <CheckIcon fontSize="small" />
            ) : (
            <EditIcon fontSize="small" />
            )}
        </IconButton>
        )}

        {/* 刪除 marker 按鈕（搬到這裡） */}
        <IconButton
            aria-label="刪除地標"
            onClick={(e) => {
            e.stopPropagation();
            onDelete();
            }}
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

      {/* 地址 + 複製 + 圖釘（同一排，黑白灰） */}
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        {editing ? (
          <TextField
            variant="standard"
            fullWidth
            label="地址"
            value={localAddress}
            onChange={(e) => setLocalAddress(e.target.value)}
          />
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: 1, wordBreak: "break-word" }}
          >
            {marker.address}
          </Typography>
        )}

        {/* 複製按鈕 */}
        {!editing && (
          <>
            <IconButton
              size="small"
              onClick={() => onCopyAddress(marker.address)}
              aria-label="複製地址"
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>

            {/* 圖釘按鈕（黑白灰，開啟 Google Maps） */}
            <IconButton
              size="small"
              onClick={() => onOpenInGoogleMaps(marker)}
              aria-label="在 Google Maps 打開導航"
            >
              <LocationOnIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </CardContent>

      {/* 上傳時間 + 刪除 */}
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
          {createdAtText && (
            <Chip
              icon={<AccessTimeIcon />}
              label={createdAtText}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Box>

      {/* 評論區 */}
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
            {c.createdAt && (
            <Typography variant="caption" color="text.secondary">
                {c.createdAt.toDate
                ? c.createdAt.toDate().toLocaleString()           // Firestore Timestamp
                : new Date(c.createdAt).toLocaleString()}
            </Typography>
            )}

          </Box>
        ))}

        {/* 新增評論輸入區域（所有人都可以） */}
        <Box sx={{ mt: 1, display: "flex", gap: 1, width: "100%" }}>
        <TextField
            variant="outlined"
            size="small"
            placeholder="留下你的評論..."
            value={commentInput}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onCommentInputChange(e.target.value)}
            sx={{ flexGrow: 1 }}    // 交給 flex 撐滿
        />
        <Button
            variant="contained"
            size="small"
            onClick={(e) => {
            e.stopPropagation();
            onAddComment();
            }}
        >
            送出
        </Button>
        </Box>

      </CardContent>

      {/* 備註輸入區域（只有作者可見） */}
      {isOwner && (
        <CardContent sx={{ pt: 0 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            備註
            </Typography>

            {/* 如果正在編輯，就顯示 TextField */}
            {noteEditing ? (
            <>
                <TextField
                variant="outlined"
                size="small"
                fullWidth
                multiline
                minRows={2}
                placeholder="請輸入備註"
                value={noteInput}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onNoteInputChange(e.target.value)}
                />


                {/* 只有內容有變更才顯示儲存按鈕 */}
                { (noteInput ?? "") !== (marker.note || "") && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                    <Button
                    variant="text"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();        // ⬅ 這行很重要，阻止事件冒泡到地圖
                        onSaveNote();               // 呼叫外面的儲存
                        setNoteEditing(false);      // 只切回顯示模式，不關 popup
                    }}
                    >
                    儲存備註
                    </Button>
                </Box>
                )}

            </>
            ) : (
            // 沒在編輯時，只顯示一行文字（可點擊進入編輯）
            <Typography
            variant="body2"
            color={marker.note ? "text.primary" : "text.secondary"}
            sx={{
                whiteSpace: "pre-wrap",
                cursor: "pointer",
            }}
            onClick={(e) => {
                // 這行很重要：不要讓 click 冒泡到地圖上
                e.stopPropagation();

                setNoteEditing(true);
                onNoteInputChange(marker.note || "");
            }}
            >
            {marker.note && marker.note.trim()
                ? marker.note
                : "請輸入備註"}
            </Typography>

            )}
        </CardContent>
        )}

    </Card>
  );
}
