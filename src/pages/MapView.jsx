// src/pages/MapView.jsx
import { useEffect, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
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
  updateDoc,
  deleteDoc,
  getDocs,
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
  CardActions
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ExitToApp as ExitToAppIcon,
  MoreVert as MoreVertIcon,
  CameraAlt as CameraAltIcon,
  LocationOn as LocationOnIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

import MapMoreMenu from "../components/MapMoreMenu";
import AboutDialog from "../components/About";

// 修復 Leaflet 默認圖標問題
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 將地圖視角移到使用者位置
function LocateControl({ onLocationFound }) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // 初次飛到使用者位置
        map.flyTo([latitude, longitude], 15);
        onLocationFound && onLocationFound({ lat: latitude, lng: longitude });
      },
      (err) => {
        console.warn("取得位置失敗：" + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [map, onLocationFound]);

  return null;
}


export default function MapView() {
  const { mapId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef();

  const [mapDoc, setMapDoc] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [deletingMarkerId, setDeletingMarkerId] = useState(null);
  const fileInputRef = useRef();
  const [userLocation, setUserLocation] = useState(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false); // 選擇拍照或上傳的彈窗


  const handleLocationFound = (coords) => {
    setUserLocation(coords); // 可用於其他功能，但不放 Marker
  };
  
  const handleLocateClick = () => {
    if (!navigator.geolocation) {
      alert("此裝置不支援 GPS");
      return;
    }

    setOpenDialog(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // 使用地圖實例飛轉到用戶位置
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 15);
        }
        
        setOpenDialog(false);
      },
      (err) => {
        setOpenDialog(false);
        alert("取得位置失敗：" + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 添加組件來獲取地圖實例
  function MapInstance() {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  }

  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (!mapId) return;
    const unsubMap = onSnapshot(doc(db, "maps", mapId), (snap) => {
      setMapDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
    return () => unsubMap();
  }, [mapId]);

  useEffect(() => {
    if (!mapId) return;
    const q = query(
      collection(db, "maps", mapId, "markers"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) =>
      setMarkers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
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
        setPendingCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setOpenDialog(false);

        // 顯示選擇拍照或上傳的 Dialog
        setPhotoDialogOpen(true);
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

      const addr = await reverseGeocode(
        pendingCoords.lat,
        pendingCoords.lng
      );

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

  const handleDeleteMarker = async (markerId) => {
    if (!window.confirm("確定要刪除此地標嗎？")) return;
    
    setDeletingMarkerId(markerId);
    try {
      await deleteDoc(doc(db, "maps", mapId, "markers", markerId));
    } catch (err) {
      alert("刪除地標失敗：" + err.message);
    } finally {
      setDeletingMarkerId(null);
    }
  };

  const handleRename = async (id, newName) => {
    await updateDoc(doc(db, "maps", id), { title: newName });
  };

  const handleDelete = async (id) => {
    const snap = await getDocs(collection(db, "maps", id, "markers"));
    for (const d of snap.docs) await deleteDoc(d.ref);
    await deleteDoc(doc(db, "maps", id));
    navigate("/maps");
  };

  const handleShare = async (id) => {
    const shareUrl = `${window.location.origin}/maps/${id}`;
    await navigator.clipboard.writeText(shareUrl);
  };

  const handleClearMarkers = async (mapId) => {
    if (!mapId) throw new Error("mapId 未提供");
  
    try {
      const markersRef = collection(db, "maps", mapId, "markers");
      const snap = await getDocs(markersRef);
      if (snap.empty) return;
  
      const CHUNK = 500;
      for (let i = 0; i < snap.docs.length; i += CHUNK) {
        const batch = writeBatch(db);
        snap.docs.slice(i, i + CHUNK).forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
      }
    } catch (err) {
      console.error("handleClearMarkers error:", err);
      throw err;
    }
  };

  const center = markers.length
    ? [markers[markers.length - 1].lat, markers[markers.length - 1].lng]
    : [25.033, 121.5654];

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton component={Link} to="/maps" edge="start" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {mapDoc?.title || "地圖"}
          </Typography>
          <AboutDialog />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVertIcon />
          </IconButton>
          <MapMoreMenu
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            map={mapDoc}
            onRename={handleRename}
            onDelete={handleDelete}
            onShare={handleShare}
            onClearMarkers={handleClearMarkers}
          />
          <IconButton onClick={() => signOut(auth)} color="inherit">
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[25.033, 121.5654]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance; // 確保地圖創建時設置 ref
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          
          <MapInstance />

          {/* 僅顯示地標，不顯示使用者 Marker */}
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
                  <CardActions>
                    <IconButton 
                      aria-label="刪除地標"
                      onClick={() => handleDeleteMarker(m.id)}
                      disabled={deletingMarkerId === m.id}
                      size="small"
                      color="error"
                    >
                      {deletingMarkerId === m.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </CardActions>
                </Card>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* 新增定位按鈕 */}
        <Fab
          color="secondary"
          aria-label="定位"
          onClick={handleLocateClick} // 使用新的處理函數
          sx={{
            position: "absolute",
            bottom: 96,
            right: 16,
            zIndex: 1000,
          }}
        >
          <LocationOnIcon />
        </Fab>

        {/* 新增地標按鈕 */}
        <Fab
          color="primary"
          aria-label="新增地標"
          onClick={startAddMarker}
          disabled={uploading}
          sx={{
            position: "absolute",
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          {uploading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <CameraAltIcon />
          )}
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

      {/* <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>獲取位置中</DialogTitle>
        <DialogContent
          sx={{ display: "flex", alignItems: "center", flexDirection: "column" }}
        >
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body2">正在獲取您的位置信息...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
        </DialogActions>
      </Dialog> */}

      <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)}>
        <DialogTitle>新增地標照片</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            請選擇新增照片方式：
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-around", mt: 2 }}>
            <Button variant="contained" component="label" color="primary">
              拍照
              <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  handleFileSelected(e);
                  setPhotoDialogOpen(false);
                }}
              />
            </Button>

            <Button variant="outlined" component="label">
              上傳照片
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  handleFileSelected(e);
                  setPhotoDialogOpen(false);
                }}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialogOpen(false)}>取消</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
