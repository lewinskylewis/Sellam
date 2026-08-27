import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Properties from "./pages/Properties";
import PropertyEditor from "./pages/PropertyEditor";
import Enquiries from "./pages/Enquiries";
import Communities from "./pages/Communities";
import CommunityEditor from "./pages/CommunityEditor";
import HeroManager from "./pages/website/HeroManager";
import HeroSlideEditor from "./pages/website/HeroSlideEditor";
import PropertyHighlights from "./pages/website/PropertyHighlights";
import Testimonials from "./pages/website/Testimonials";

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
            path="/communities"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Communities />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CommunityEditor />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities/:key/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CommunityEditor />
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
          <Route
            path="/website/hero"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HeroManager />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/website/hero/new"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HeroSlideEditor />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/website/hero/:id/edit"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <HeroSlideEditor />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/website/property-highlights"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <PropertyHighlights />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/website/testimonials"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Testimonials />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
