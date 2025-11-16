import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { getInitialTheme } from "./utils/theme";
import { useTheme } from "@mui/material/styles";
import Loading from "./components/Loading";
import AuthPage from "./pages/AuthPage";
import MapsPage from "./pages/MapsPage";
import MapView from "./pages/MapView";
import ThemeToggle from "./components/ThemeToggle";


function AppWrapper({ children }) {
  const theme = useTheme();

  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.background.default;
  }, [theme.palette.background.default]);

  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [themeMode, setThemeMode] = useState(getInitialTheme()); // ✅ 注意這裡

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  if (initializing) return <Loading />;

  const toggleTheme = () => {
    setThemeMode(themeMode === "light" ? "dark" : "light");
    localStorage.setItem("theme", themeMode === "light" ? "dark" : "light");
  };

  // 建立 MUI 主題
  const muiTheme = createTheme({
    palette: {
      mode: themeMode, // ✅ 這裡用 state
    },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <AppWrapper>
        <HashRouter>
          {/* <ThemeToggle theme={themeMode} toggleTheme={toggleTheme} /> */}
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <MapsPage user={user} themeMode={themeMode} toggleTheme={toggleTheme} />
                ) : (
                  <AuthPage themeMode={themeMode} toggleTheme={toggleTheme} />
                )
              }
            />

            <Route path="/login" element={<AuthPage themeMode={themeMode} toggleTheme={toggleTheme} />} />
            <Route path="/maps" element={user ? <MapsPage user={user} themeMode={themeMode} toggleTheme={toggleTheme} /> : <AuthPage />} />
            <Route path="/map/:mapId" element={user ? <MapView themeMode={themeMode} toggleTheme={toggleTheme} /> : <AuthPage />} />
          </Routes>
        </HashRouter>
      </AppWrapper>
      
    </ThemeProvider>
  );
}
