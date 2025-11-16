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
import UserProfilePage from "./pages/UserProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

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
  const [themeMode, setThemeMode] = useState(getInitialTheme());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setInitializing(false);
    });
    return () => unsub();
  }, []);

  if (initializing) return <Loading />;

  const toggleTheme = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    localStorage.setItem("theme", next);
  };

  const muiTheme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <AppWrapper>
        <HashRouter>
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  <MapsPage
                    user={user}
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                  />
                ) : (
                  <AuthPage
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                  />
                )
              }
            />

            <Route
              path="/login"
              element={
                <AuthPage
                  themeMode={themeMode}
                  toggleTheme={toggleTheme}
                />
              }
            />

            <Route
              path="/maps"
              element={
                user ? (
                  <MapsPage
                    user={user}
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                  />
                ) : (
                  <AuthPage
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                  />
                )
              }
            />

            <Route
              path="/map/:mapId"
              element={
                user ? (
                  <MapView
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                  />
                ) : (
                  <AuthPage
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                  />
                )
              }
            />

            {/* 使用者空間 */}
            <Route
              path="/me"
              element={
                user ? (
                  <UserProfilePage
                    themeMode={themeMode}
                    toggleTheme={toggleTheme}
                  />
                ) : (
                  <AuthPage themeMode={themeMode} toggleTheme={toggleTheme} />
                )
              }
            />

            <Route
              path="/forgot-password"
              element={
                <ForgotPasswordPage
                  themeMode={themeMode}
                  toggleTheme={toggleTheme}
                />
              }
            />
          </Routes>
        </HashRouter>
      </AppWrapper>
    </ThemeProvider>
  );
}
