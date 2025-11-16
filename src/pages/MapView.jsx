// src/pages/MapView.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

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
} from "firebase/firestore";

import {
  Box,
  CircularProgress,
  Fab,
  Snackbar,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";

import CameraAltIcon from "@mui/icons-material/CameraAlt";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import MapToolbar from "../components/MapToolbar";
import MarkerPopupCard from "../components/MarkerPopupCard";
import AddMarkerPhotoDialog from "../components/AddMarkerPhotoDialog";
import FullImageDialog from "../components/FullImageDialog";

import { reverseGeocode } from "../utils/geocode";
import {
  renameMap,
  deleteMap,
  shareMap,
  clearMarkers,
} from "../utils/mapActions";
import { compressAndConvertToBase64 } from "../utils/image";

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

// 小工具組件：拿到地圖實例
function MapInstance({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export default function MapView({ themeMode, toggleTheme }) {
  const { mapId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef();

  const [mapDoc, setMapDoc] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [gpsDialogOpen, setGpsDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [deletingMarkerId, setDeletingMarkerId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [enlargedImg, setEnlargedImg] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // 取得地圖資料
  useEffect(() => {
    if (!mapId) return;

    const unsubMap = onSnapshot(doc(db, "maps", mapId), (snap) => {
      setMapDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });

    return () => unsubMap();
  }, [mapId]);

  // 取得 marker 資料
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

  // 定位按鈕
  const handleLocateClick = () => {
    if (!navigator.geolocation) {
      alert("此裝置不支援 GPS");
      return;
    }

    setGpsDialogOpen(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 15);
        }

        setGpsDialogOpen(false);
      },
      (err) => {
        setGpsDialogOpen(false);
        alert("取得位置失敗：" + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 開始新增 marker
  function startAddMarker() {
    if (!navigator.geolocation) {
      alert("此裝置不支援 GPS");
      return;
    }

    setGpsDialogOpen(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsDialogOpen(false);
        setPhotoDialogOpen(true);
      },
      (err) => {
        setGpsDialogOpen(false);
        alert("取得位置失敗：" + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // 上傳 / 拍照 選完檔案
  async function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file || !pendingCoords) return;
    setUploading(true);

    try {
      const base64Data = await compressAndConvertToBase64(file);

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
        title: "未命名地標",
        note: "",
        comments: [],
        createdBy: auth.currentUser?.uid || null,
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

  const handleRenameMap = async (id, newName) => {
    await renameMap(id, newName);
    setMapDoc((prev) =>
      prev && prev.id === id ? { ...prev, title: newName } : prev
    );
  };

  const handleDeleteMap = async (id) => {
    await deleteMap(id);
    setMapDoc(null);
    navigate("/maps");
  };

  const handleShareMap = async (id) => {
    await shareMap(id);
  };

  const handleClearMarkers = async (mapIdForClear) => {
    try {
      await clearMarkers(mapIdForClear);
    } catch (err) {
      console.error("handleClearMarkers error:", err);
    }
  };

  const handleCopyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setSnackbar({
        open: true,
        message: "地址已複製！",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "複製失敗：" + err.message,
        severity: "error",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const handleBack = () => {
    navigate("/maps");
  };

  const center = markers.length
    ? [markers[markers.length - 1].lat, markers[markers.length - 1].lng]
    : [25.033, 121.5654];

  const handleOpenInGoogleMaps = (marker) => {
    const { lat, lng, address } = marker;
    const destination = address || `${lat},${lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination
    )}`;

    window.open(url, "_blank");
  };


  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <MapToolbar
        title={mapDoc?.title}
        themeMode={themeMode}
        toggleTheme={toggleTheme}
        map={mapDoc}
        onRename={handleRenameMap}
        onDelete={handleDeleteMap}
        onShare={handleShareMap}
        onClearMarkers={handleClearMarkers}
        onLogout={handleLogout}
        onBack={handleBack}
      />

      <Box sx={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <MapInstance mapRef={mapRef} />

          {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>
              <MarkerPopupCard
                marker={m}
                onCopyAddress={handleCopyAddress}
                onDelete={() => handleDeleteMarker(m.id)}
                isDeleting={deletingMarkerId === m.id}
                onImageClick={setEnlargedImg}
                onOpenInGoogleMaps={handleOpenInGoogleMaps}
                currentUserUid={auth.currentUser?.uid || null}
              />
            </Popup>
          </Marker>
        ))}

        </MapContainer>

        {/* 定位按鈕 */}
        <Fab
          color="secondary"
          aria-label="定位"
          onClick={handleLocateClick}
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

      {/* 新增地標照片 Dialog */}
      <AddMarkerPhotoDialog
        open={photoDialogOpen}
        onClose={() => setPhotoDialogOpen(false)}
        onFileSelected={handleFileSelected}
      />

      {/* 放大圖片 Dialog */}
      <FullImageDialog
        src={enlargedImg}
        open={!!enlargedImg}
        onClose={() => setEnlargedImg(null)}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
