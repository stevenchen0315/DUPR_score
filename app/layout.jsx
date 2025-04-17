// app/layout.jsx
export const metadata = {
  title: 'DUPR Score App',
  description: '管理選手與比賽資料',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
