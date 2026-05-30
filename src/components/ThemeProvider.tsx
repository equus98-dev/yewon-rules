"use client";

import { createTheme, ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ReactNode } from "react";

// 예원예술대학교 규정관리시스템을 위한 세련되고 고급스러운 다크 네이비 & 골드/블루 프리미엄 테마
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1E3A8A", // 깊고 신뢰감을 주는 로열 네이비 블루
      light: "#3B82F6",
      dark: "#172554",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#B45309", // 중후하고 고급스러운 골드 브라운/엠버
      light: "#F59E0B",
      dark: "#78350F",
    },
    background: {
      default: "#F8FAFC", // 깨끗한 오프화이트/슬레이트 백그라운드
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A", // 차분하고 가독성 높은 다크 챠콜 슬레이트
      secondary: "#475569",
    },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: [
      "Pretendard",
      "-apple-system",
      "BlinkMacSystemFont",
      "system-ui",
      "Roboto",
      "Helvetica Neue",
      "Segoe UI",
      "Apple SD Gothic Neo",
      "Noto Sans KR",
      "Malgun Gothic",
      "sans-serif",
    ].join(","),
    h1: {
      fontWeight: 700,
      fontSize: "2.25rem",
      color: "#1E3A8A",
    },
    h2: {
      fontWeight: 700,
      fontSize: "1.75rem",
      color: "#1E3A8A",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#0F172A",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 6,
          fontWeight: 600,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.95rem",
          minHeight: 48,
        },
      },
    },
  },
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
