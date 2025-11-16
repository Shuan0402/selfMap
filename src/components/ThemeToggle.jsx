import { IconButton, Tooltip } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

export default function ThemeToggle({ theme, toggleTheme }) {
  return (
    <Tooltip title={theme === "light" ? "切換到深色模式" : "切換到淺色模式"}>
      <IconButton onClick={toggleTheme} color="inherit">
        {theme === "light" ? <DarkModeIcon /> : <LightModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
