# SelfMap
SelfMap 是一個以 React 建構的個人地圖管理應用程式，後端以 Firebase 為核心，提供使用者建立專屬地圖、管理地標、記錄資訊等功能。該應用支援登入、註冊、地圖操作、評論、圖片上傳與通知等完整互動流程。

## 功能簡介
### 會員與使用者功能
- 使用者登入與註冊
- 忘記密碼、寄送重設密碼信件
- 使用者資訊編輯
- 刪除帳號
- 深色與淺色主題切換

### 地圖功能
- 建立地圖
- 編輯地圖資訊：重新命名、清空地標、刪除地圖
- 分享地圖產生可共享連結
- 外接地圖 API（Leaflet + OpenStreetMap）
- 地圖放大、縮小
- 定位至使用者座標
- 地標（Marker）功能
- 新增地標（支援定位拍照或上傳圖片）
- 編輯地標標題、地址、備註
- 刪除地標
- 新增與更新評論
- Google Maps 導航
- 地標列表視窗，可點擊自動定位至該地標
- 支援圖片上傳、壓縮與放大查看

### 最新消息與通知系統
- 針對使用者操作記錄事件，顯示於最新消息列表
- 可清空所有最新消息
- (TODO) 訂閱地圖後可接收新增地標通知
- 使用 Firestore 的即時更新特性

### 其他功能
- About 頁面
- Firebase 驗證與資料庫串接
- 支援 GitHub Pages 部署

## 使用技術
### 前端
- React 18
- React Router DOM
- Material UI (MUI)
- Leaflet
- Vite

### 後端
- Firebase Authentication
- Firebase Firestore

### 其他
- 圖片壓縮與 Base64 處理
- GitHub Pages 部署
- 即時資料同步（onSnapshot）

## 專案架構概述
```css=
src/
├── components/
│   ├── AppTopBar.jsx
│   ├── ThemeToggle.jsx
│   ├── MarkerPopupCard.jsx
│   ├── MarkerListDialog.jsx
│   ├── RecentActivityDialog.jsx
│   └── ...
│
├── pages/
│   ├── AuthPage.jsx
│   ├── MapView.jsx
│   ├── ForgotPasswordPage.jsx
│   ├── UserProfilePage.jsx
│   └── ...
│
├── utils/
│   ├── activity.js
│   ├── geocode.js
│   ├── image.js
│   ├── mapActions.js
│   └── ...
│
├── firebase.js
├── App.jsx
└── main.jsx
```

## 未來可擴充項目
- Firebase Cloud Functions 自動寄送 Email 通知
- 地標關鍵字搜尋或分類
- 地圖匯出與備份

## 授權
本專案採用 MIT License。