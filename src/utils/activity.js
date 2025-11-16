// src/utils/activity.js
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * 紀錄使用者最近活動
 * @param {string} userId - 使用者 UID
 * @param {string} type   - 活動類型（例：'rename_user', 'edit_marker', 'delete_marker'）
 * @param {string} message - 顯示在「最近消息」的文字
 * @param {object} extra   - 其他想存的欄位（可選）
 */
export async function logActivity(userId, type, message, extra = {}) {
  if (!userId) return;

  try {
    await addDoc(collection(db, "users", userId, "activities"), {
      type,
      message,
      ...extra,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("logActivity error:", err);
  }
}
