import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Properties from "./pages/Properties";
import PropertyEditor from "./pages/PropertyEditor";
import Enquiries from "./pages/Enquiries";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Overview />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Properties />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PropertyEditor />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/properties/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PropertyEditor />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/enquiries"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Enquiries />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
