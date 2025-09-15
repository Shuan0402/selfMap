/*
Mobile Map Starter (Base64 version)

- Email/password auth
- Multiple maps
- Add marker with GPS + photo
- Photo stored as Base64 in Firestore
*/

import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

// Firebase (modular v9+)
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// TODO: replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAPcdwpdfDEzZ2RXD6Sr35488hRtg5Co_8",
  authDomain: "selfmap-d948d.firebaseapp.com",
  projectId: "selfmap-d948d",
  storageBucket: "selfmap-d948d.firebasestorage.app",
  messagingSenderId: "492340350388",
  appId: "1:492340350388:web:f847717f5a0b5e9419b6e1",
  measurementId: "G-S8QV830559",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ------------------ Helper: reverse geocode (直接打 Nominatim)
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.display_name || "";
  } catch (e) {
    console.error("reverseGeocode error", e);
    return "";
  }
}

// ------------------ Auth Page
function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/maps");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/maps");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center" }}>手機地圖 App</h2>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
        <button onClick={() => setMode("signin")} disabled={mode === "signin"}>登入</button>
        <button onClick={() => setMode("signup")} disabled={mode === "signup"}>註冊</button>
      </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp}>
        <label>
          信箱
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          密碼
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <div style={{ marginTop: 12 }}>
          <button type="submit">{mode === "signin" ? "登入" : "建立帳號"}</button>
        </div>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

// ------------------ Maps List
function MapsPage({ user }) {
  const [maps, setMaps] = useState([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "maps"), where("ownerUid", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMaps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  async function createMap() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const docRef = await addDoc(collection(db, "maps"), {
        title: title.trim(),
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      navigate(`/map/${docRef.id}`);
    } catch (e) {
      console.error(e);
      alert("建立失敗");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>我的地圖</h3>
        <button onClick={() => signOut(auth)}>登出</button>
      </header>

      <div style={{ marginTop: 12 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="新地圖名稱" />
        <button onClick={createMap} disabled={creating}>建立</button>
      </div>

      <ul style={{ marginTop: 16 }}>
        {maps.map((m) => (
          <li key={m.id} style={{ padding: 8, borderBottom: "1px solid #ddd" }}>
            <Link to={`/map/${m.id}`}>{m.title || "(未命名地圖)"}</Link>
          </li>
        ))}
      </ul>

      {maps.length === 0 && <p style={{ marginTop: 12 }}>還沒有地圖 — 建立一個吧！</p>}
    </div>
  );
}

// ------------------ Map View
function MapView({ user }) {
  const { mapId } = useParams();
  const [mapDoc, setMapDoc] = useState(null);
  const [markers, setMarkers] = useState([]);
  const fileInputRef = useRef();
  const [pendingCoords, setPendingCoords] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    const unsub = onSnapshot(q, (snap) => {
      setMarkers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [mapId]);

  function startAddMarker() {
    if (!navigator.geolocation) {
      alert("此裝置不支援 GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fileInputRef.current && fileInputRef.current.click();
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
      // 1. 將圖片轉成 Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. 取得地點名稱
      const addr = await reverseGeocode(pendingCoords.lat, pendingCoords.lng);

      // 3. 存入 Firestore
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
      console.error(err);
      alert("上傳失敗：" + err.message);
    } finally {
      setUploading(false);
    }
  }

  const center =
    markers.length > 0
      ? [markers[markers.length - 1].lat, markers[markers.length - 1].lng]
      : [25.0330, 121.5654];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link to="/maps">⬅ 返回</Link>
          <strong style={{ marginLeft: 8 }}>{mapDoc?.title || "地圖"}</strong>
        </div>
        <div>
          <button onClick={() => signOut(auth)}>登出</button>
        </div>
      </header>

      <div style={{ flex: 1 }}>
        <MapContainer center={center} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {markers.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]}>
              <Popup>
                <div style={{ maxWidth: 240 }}>
                  <div style={{ fontSize: 12, color: "#444" }}>{m.address}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : ""}</div>
                  {m.photoBase64 && (
                    <img src={m.photoBase64} alt="site" style={{ width: "100%", marginTop: 8, borderRadius: 6 }} />
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div style={{ padding: 8, display: "flex", gap: 8, justifyContent: "center" }}>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileSelected} />
        <button onClick={startAddMarker} disabled={uploading}>{uploading ? "上傳中..." : "新增地標（使用 GPS + 拍照）"}</button>
      </div>
    </div>
  );
}

// ------------------ App Root
function AppRoot() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  if (initializing) return <div style={{ padding: 20 }}>載入中…</div>;

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={user ? <MapsPage user={user} /> : <AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/maps" element={user ? <MapsPage user={user} /> : <AuthPage />} />
        <Route path="/map/:mapId" element={user ? <MapView user={user} /> : <AuthPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function MobileMapApp() {
  return <AppRoot />;
}
