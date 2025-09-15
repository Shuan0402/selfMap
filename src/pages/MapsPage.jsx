import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function MapsPage({ user }) {
  const [maps, setMaps] = useState([]);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "maps"), where("ownerUid", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setMaps(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
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
    } catch {
      alert("建立失敗");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={{ padding: 12 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
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
