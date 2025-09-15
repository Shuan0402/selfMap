import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "./firebase";
import Loading from "./components/Loading";
import AuthPage from "./pages/AuthPage";
import MapsPage from "./pages/MapsPage";
import MapView from "./pages/MapView";
import { HashRouter } from "react-router-dom";

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  if (initializing) return <Loading />;

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={user ? <MapsPage user={user} /> : <AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/maps" element={user ? <MapsPage user={user} /> : <AuthPage />} />
        <Route path="/map/:mapId" element={user ? <MapView /> : <AuthPage />} />
      </Routes>
    </HashRouter>
  );
}
