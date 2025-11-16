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
  updateDoc,
  arrayUnion,
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
import ListIcon from "@mui/icons-material/List";
import MarkerListDialog from "../components/MarkerListDialog";

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
  const [commentInputs, setCommentInputs] = useState({});
  const [noteInputs, setNoteInputs] = useState({});
  const [openedPopupId, setOpenedPopupId] = useState(null);
  const [markerListOpen, setMarkerListOpen] = useState(false);
  const markerRefs = useRef({}); 



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

  // 更新「新增評論」時輸入框
  const handleCommentInputChange = (markerId, value) => {
    setCommentInputs((prev) => ({ ...prev, [markerId]: value }));
  };

  // 送出評論
  const handleAddComment = async (marker) => {
    const markerId = marker.id;
    const text = (commentInputs[markerId] || "").trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) {
      alert("請先登入再留言");
      return;
    }

    const userUid = user.uid;
    const userName = user.displayName || "未命名使用者";

    // 先從目前 state 取得現有評論
    const existingComments = Array.isArray(marker.comments)
      ? marker.comments
      : [];

    // 把這個使用者以前留過的評論移除
    const filtered = existingComments.filter(
      (c) => c.authorUid !== userUid
    );

    // 加入最新這一筆
    const newComments = [
      ...filtered,
      {
        text,
        authorName: userName,
        authorUid: userUid,
        createdAt: Date.now(), // 用 client 時間即可
      },
    ];

    try {
      await updateDoc(doc(db, "maps", mapId, "markers", markerId), {
        comments: newComments,
      });

      setCommentInputs((prev) => ({ ...prev, [markerId]: "" }));
    } catch (err) {
      alert("新增評論失敗：" + err.message);
    }
  };

  // 備註輸入框的值
  const handleNoteInputChange = (markerId, value) => {
    setNoteInputs((prev) => ({ ...prev, [markerId]: value }));
  };

  // 儲存備註
  const handleSaveNote = async (markerId) => {
    const value = (noteInputs[markerId] ?? "").trim();

    try {
      await updateDoc(doc(db, "maps", mapId, "markers", markerId), {
        note: value,
      });
    } catch (err) {
      alert("儲存備註失敗：" + err.message);
    }
  };

  // 編輯標題 / 地址
  const handleUpdateMarkerMeta = async (markerId, data) => {
    try {
      await updateDoc(doc(db, "maps", mapId, "markers", markerId), data);
    } catch (err) {
      alert("更新地標資訊失敗：" + err.message);
    }
  };

  // 最上面已經有 import L from "leaflet"; 的話就不用再加

  const handleSelectMarkerFromList = (marker) => {
    setMarkerListOpen(false);

    const map = mapRef.current;
    if (map) {
      const zoom = map.getZoom() || 16;

      // 目標地標的位置
      const targetLatLng = L.latLng(marker.lat, marker.lng);
      const targetPoint = map.project(targetLatLng, zoom);

      // ⭐ 把地圖「中心」往上移 270px，
      // 讓 marker 看起來在畫面偏下（上面空間給 Popup）
      const offsetY = 270; // 可以自己微調 100~200
      const centerPoint = targetPoint.subtract([0, offsetY]);
      const centerLatLng = map.unproject(centerPoint, zoom);

      map.flyTo(centerLatLng, zoom, { animate: true });

      // 再打開該 marker 的 Popup
      const markerInstance = markerRefs.current[marker.id];
      if (markerInstance) {
        // 先把其他 Popup 關掉以防萬一
        map.closePopup();
        markerInstance.openPopup();
      }
    }

    setOpenedPopupId(marker.id);
  };



  const handleOpenMarkerList = () => {
    // ⭐ 先關掉目前所有 Popup
    if (mapRef.current) {
      mapRef.current.closePopup();
    }
    setOpenedPopupId(null);

    // 再打開列表 Dialog
    setMarkerListOpen(true);
  };



  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: (theme) => theme.palette.background.default, }}>
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
          userName={auth.currentUser?.displayName || "未命名使用者"}
        />

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
            <Marker
              key={m.id}
              position={[m.lat, m.lng]}
              // ⭐ 用 ref 把 Leaflet marker 實體存起來
              ref={(markerInstance) => {
                if (markerInstance) {
                  markerRefs.current[m.id] = markerInstance;
                }
              }}
              eventHandlers={{
                click: () => {
                  // Leaflet 默認會 autoClose 其他 Popup，不用自己關
                  setOpenedPopupId(m.id);
                },
              }}
            >
              {/* ⭐ 不要再用 open={...}，讓 Leaflet 自己處理開關 */}
              <Popup>
                <MarkerPopupCard
                  marker={m}
                  currentUserUid={auth.currentUser?.uid || null}
                  onCopyAddress={handleCopyAddress}
                  onDelete={() => handleDeleteMarker(m.id)}
                  isDeleting={deletingMarkerId === m.id}
                  onImageClick={setEnlargedImg}
                  onOpenInGoogleMaps={handleOpenInGoogleMaps}
                  // 評論
                  commentInput={commentInputs[m.id] || ""}
                  onCommentInputChange={(value) =>
                    handleCommentInputChange(m.id, value)
                  }
                  onAddComment={() => handleAddComment(m)}
                  // 備註
                  noteInput={
                    noteInputs[m.id] !== undefined
                      ? noteInputs[m.id]
                      : m.note || ""
                  }
                  onNoteInputChange={(value) =>
                    handleNoteInputChange(m.id, value)
                  }
                  onSaveNote={async () => {
                    await handleSaveNote(m.id);
                    // ⭐ 不再關閉 popup，只改回顯示模式（這部分你已經有做）
                  }}
                  // 標題地址編輯
                  onUpdateMeta={(data) => handleUpdateMarkerMeta(m.id, data)}
                />
              </Popup>
            </Marker>
          ))}



        </MapContainer>

        {/* 地標列表按鈕 */}
        <Fab
          color="default"
          aria-label="地標列表"
          onClick={handleOpenMarkerList}
          sx={{
            position: "absolute",
            bottom: 176,
            right: 16,
            zIndex: 1000,
          }}
        >
          <ListIcon />
        </Fab>


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

      {/* 地標列表 Dialog */}
      <MarkerListDialog
        open={markerListOpen}
        onClose={() => setMarkerListOpen(false)}
        markers={markers}
        onSelectMarker={handleSelectMarkerFromList}
      />
    </Box>
  );
}
