import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp, 
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { reverseGeocode } from "../utils/geocode";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ExitToApp as ExitToAppIcon,
  Add as AddIcon,
  LocationOn as LocationOnIcon,
  CameraAlt as CameraAltIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

// 修復 Leaflet 默認圖標問題
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
  const { mapId } = useParams();
  const navigate = useNavigate();
  const [mapDoc, setMapDoc] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!mapId) return;
    const unsubMap = onSnapshot(doc(db, "maps", mapId), (snap) => {
      setMapDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return () => unsubMap();
  }, [mapId]);

  useEffect(() => {
    if (!mapId) return;
    const q = query(collection(db, "maps", mapId, "markers"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => setMarkers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [mapId]);

  function startAddMarker() {
    if (!navigator.geolocation) {
      alert("此裝置不支援 GPS");
      return;
    }
    
    setOpenDialog(true);
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOpenDialog(false);
        fileInputRef.current?.click();
      },
      (err) => {
        setOpenDialog(false);
        alert("取得位置失敗：" + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file || !pendingCoords) return;
    setUploading(true);

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const addr = await reverseGeocode(pendingCoords.lat, pendingCoords.lng);

      await addDoc(collection(db, "maps", mapId, "markers"), {
        lat: pendingCoords.lat,
        lng: pendingCoords.lng,
        photoBase64: base64Data,
        address: addr,
        createdAt: serverTimestamp(),
      });

      setPendingCoords(null);
      e.target.value = null;
    } catch (err) {
      alert("上傳失敗：" + err.message);
    } finally {
      setUploading(false);
    }
  }

  // 刪除地圖功能
  const handleDeleteMap = async () => {
    if (!mapId) return;
    
    setDeleting(true);
    try {
      // 創建一個批量操作
      const batch = writeBatch(db);
      
      // 刪除所有標記
      markers.forEach(marker => {
        const markerRef = doc(db, "maps", mapId, "markers", marker.id);
        batch.delete(markerRef);
      });
      
      // 刪除地圖文檔
      const mapRef = doc(db, "maps", mapId);
      batch.delete(mapRef);
      
      // 提交批量操作
      await batch.commit();
      
      // 導航回地圖列表
      navigate("/maps");
    } catch (err) {
      console.error("刪除地圖失敗:", err);
      alert("刪除地圖失敗：" + err.message);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const center = markers.length
    ? [markers[markers.length - 1].lat, markers[markers.length - 1].lng]
    : [25.0330, 121.5654];

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton component={Link} to="/maps" edge="start" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {mapDoc?.title || "地圖"}
          </Typography>
          
          {/* 更多選項按鈕 */}
          <IconButton 
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            color="inherit"
          >
            <MoreVertIcon />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={() => {
              setMenuAnchor(null);
              setDeleteConfirmOpen(true);
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>刪除地圖</ListItemText>
            </MenuItem>
          </Menu>
          
          <IconButton onClick={() => signOut(auth)} color="inherit">
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, position: "relative" }}>
        <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]}>
              <Popup>
                <Card sx={{ maxWidth: 300 }}>
                  {m.photoBase64 && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={m.photoBase64}
                      alt="地點照片"
                    />
                  )}
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {m.address}
                    </Typography>
                    {m.createdAt?.toDate && (
                      <Chip
                        icon={<LocationOnIcon />}
                        label={m.createdAt.toDate().toLocaleString()}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        <Fab
          color="primary"
          aria-label="新增地標"
          onClick={startAddMarker}
          disabled={uploading}
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          {uploading ? <CircularProgress size={24} color="inherit" /> : <CameraAltIcon />}
        </Fab>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>獲取位置中</DialogTitle>
        <DialogContent sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2">正在獲取您的位置信息...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
        </DialogActions>
      </Dialog>
      
      {/* 刪除確認對話框 */}
      <Dialog open={deleteConfirmOpen} onClose={() => !deleting && setDeleteConfirmOpen(false)}>
        <DialogTitle>刪除地圖</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            確定要刪除地圖 "{mapDoc?.title || '未命名地圖'}" 嗎？
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
    </Box>
  );
}