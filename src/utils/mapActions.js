import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";

// 重新命名
export async function renameMap(id, newName) {
  await updateDoc(doc(db, "maps", id), { title: newName });
}

// 刪除地圖
export async function deleteMap(id) {
  await deleteDoc(doc(db, "maps", id));
}

// 分享地圖
export async function shareMap(id) {
  const url = `${window.location.origin}/map/${id}`;
  await navigator.clipboard.writeText(url);
  return url;
}

// 清空標記
export async function clearMarkers(mapId) {
  if (!mapId) throw new Error("mapId 未提供");

  const markersRef = collection(db, "maps", mapId, "markers");
  const snap = await getDocs(markersRef);
  if (snap.empty) return;

  const CHUNK = 500;
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + CHUNK).forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
  }
}
