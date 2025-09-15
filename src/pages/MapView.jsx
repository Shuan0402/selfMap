import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { reverseGeocode } from "../utils/geocode";

import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl });

export default function MapView() {
  const { mapId } = useParams();
  const [mapDoc, setMapDoc] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [uploading, setUploading] = useState(false);
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
    if (!navigator.geolocation) return alert("此裝置不支援 GPS");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fileInputRef.current?.click();
      },
      (err) => alert("取得位置失敗：" + err.message),
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

  const center = markers.length
    ? [markers[markers.length - 1].lat, markers[markers.length - 1].lng]
    : [25.0330, 121.5654];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 8, display: "flex", justifyContent: "space-between" }}>
        <div>
          <Link to="/maps">⬅ 返回</Link>
          <strong style={{ marginLeft: 8 }}>{mapDoc?.title || "地圖"}</strong>
        </div>
        <button onClick={() => signOut(auth)}>登出</button>
      </header>

      <div style={{ flex: 1 }}>
        <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]}>
              <Popup>
                <div style={{ maxWidth: 240 }}>
                  <div style={{ fontSize: 12, color: "#444" }}>{m.address}</div>
                  {m.createdAt?.toDate && (
                    <div style={{ fontSize: 12, color: "#666" }}>{m.createdAt.toDate().toLocaleString()}</div>
                  )}
                  {m.photoBase64 && (
                    <img src={m.photoBase64} alt="site" style={{ width: "100%", marginTop: 8, borderRadius: 6 }} />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ padding: 8, display: "flex", justifyContent: "center" }}>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileSelected} />
        <button onClick={startAddMarker} disabled={uploading}>{uploading ? "上傳中..." : "新增地標（使用 GPS + 拍照）"}</button>
      </div>
    </div>
  );
}
