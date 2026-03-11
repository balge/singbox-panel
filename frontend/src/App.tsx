import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AuthProvider } from "@/contexts/AuthContext"
import { DnsPage } from "@/pages/DnsPage"
import { ExperimentalPage } from "@/pages/ExperimentalPage"
import { HomePage } from "@/pages/HomePage"
import { InboundsPage } from "@/pages/InboundsPage"
import { LogPage } from "@/pages/LogPage"
import { LoginRoute } from "@/pages/LoginRoute"
import { NtpPage } from "@/pages/NtpPage"
import { OutboundsPage } from "@/pages/OutboundsPage"
import { RoutePage } from "@/pages/RoutePage"

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
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="experimental" element={<ExperimentalPage />} />
            <Route path="dns" element={<DnsPage />} />
            <Route path="log" element={<LogPage />} />
            <Route path="ntp" element={<NtpPage />} />
            <Route path="inbounds" element={<InboundsPage />} />
            <Route path="outbounds" element={<OutboundsPage />} />
            <Route path="route" element={<RoutePage />} />
          </Route>
          <Route path="*" element={<LoginRoute />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
