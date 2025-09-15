import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
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
      <form onSubmit={handleAuth}>
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
