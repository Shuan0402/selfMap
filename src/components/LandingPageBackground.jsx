// src/components/LandingPageBackground.jsx
import { Box } from "@mui/material";

export default function LandingPageBackground() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {/* 大圓形 1 */}
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            position: "absolute",
            width: 520,
            height: 520,
            borderRadius: "50%",
            top: -160,
            right: -100,
            backgroundColor: isDark ? "#F9FAFB" : theme.palette.primary.main,
            opacity: isDark ? 0.35 : 0.45,
          };
        }}
      />

      {/* 大圓形 2 */}
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            bottom: -160,
            left: -80,
            backgroundColor: isDark ? "#64748B" : theme.palette.grey[300],
            opacity: isDark ? 0.35 : 0.4,
          };
        }}
      />

      {/* 矩形 1 */}
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            position: "absolute",
            width: 320,
            height: 160,
            borderRadius: 40,
            top: "42%",
            left: "6%",
            transform: "rotate(-8deg)",
            backgroundColor: isDark ? "#FFFFFF" : theme.palette.primary.light,
            opacity: isDark ? 0.3 : 0.35,
          };
        }}
      />

      {/* 矩形 2 */}
      <Box
        sx={(theme) => {
          const isDark = theme.palette.mode === "dark";
          return {
            position: "absolute",
            width: 300,
            height: 150,
            borderRadius: 40,
            bottom: "18%",
            right: "5%",
            transform: "rotate(6deg)",
            backgroundColor: isDark ? "#475569" : theme.palette.grey[200],
            opacity: isDark ? 0.25 : 0.3,
          };
        }}
      />
    </Box>
  );
}
