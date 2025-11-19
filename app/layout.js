// app/layout.js
import "../styles/globals.css";
import "../styles/test.css";

export const metadata = {
  title: "Basketball Dashboard",
  description: "Visualización de rendimiento deportivo"
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

