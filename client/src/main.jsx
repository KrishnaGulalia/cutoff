import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "@fontsource-variable/manrope";
import "./styles.css";
import "./responsive.css";
import "./report.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <AuthProvider>
        <App />
      </AuthProvider>
    ),
  },
]);
createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />,
);
