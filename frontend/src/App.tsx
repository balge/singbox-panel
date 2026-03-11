import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AuthProvider } from "@/contexts/AuthContext"
import { DnsPage } from "@/pages/DnsPage"
import { ExperimentalPage } from "@/pages/ExperimentalPage"
import { HomePage } from "@/pages/HomePage"
import { InboundsPage } from "@/pages/InboundsPage"
import { LogPage } from "@/pages/LogPage"
import { NtpPage } from "@/pages/NtpPage"
import { OutboundsPage } from "@/pages/OutboundsPage"
import { RoutePage } from "@/pages/RoutePage"
import { LoginRoute } from "@/pages/LoginRoute"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/experimental"
            element={
              <ProtectedRoute>
                <ExperimentalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dns"
            element={
              <ProtectedRoute>
                <DnsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute>
                <LogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ntp"
            element={
              <ProtectedRoute>
                <NtpPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbounds"
            element={
              <ProtectedRoute>
                <InboundsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/outbounds"
            element={
              <ProtectedRoute>
                <OutboundsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/route"
            element={
              <ProtectedRoute>
                <RoutePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<LoginRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
