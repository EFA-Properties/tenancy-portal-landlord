import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

// Auth Pages
import { Login } from './pages/Login'
import { Register } from './pages/Register'

// Main Pages
import { Dashboard } from './pages/Dashboard'
import { Settings } from './pages/Settings'

// Properties
import { PropertiesList } from './pages/properties/PropertiesList'
import { PropertyDetail } from './pages/properties/PropertyDetail'
import { AddProperty } from './pages/properties/AddProperty'

// Tenancies
import { TenanciesList } from './pages/tenancies/TenanciesList'
import { TenancyDetail } from './pages/tenancies/TenancyDetail'
import { AddTenancy } from './pages/tenancies/AddTenancy'

// Tenants
import { TenantsList } from './pages/tenants/TenantsList'
import { TenantDetail } from './pages/tenants/TenantDetail'
import { InviteTenant } from './pages/tenants/InviteTenant'

// Documents
import { DocumentsList } from './pages/documents/DocumentsList'
import { UploadDocument } from './pages/documents/UploadDocument'

// Compliance
import { ComplianceAlerts } from './pages/compliance/ComplianceAlerts'

// Maintenance
import { MaintenanceList } from './pages/maintenance/MaintenanceList'
import { MaintenanceDetail } from './pages/maintenance/MaintenanceDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/settings" element={<Settings />} />

                      {/* Properties */}
                      <Route path="/properties" element={<PropertiesList />} />
                      <Route path="/properties/:id" element={<PropertyDetail />} />
                      <Route path="/properties/add" element={<AddProperty />} />

                      {/* Tenancies */}
                      <Route path="/tenancies" element={<TenanciesList />} />
                      <Route path="/tenancies/:id" element={<TenancyDetail />} />
                      <Route path="/tenancies/add" element={<AddTenancy />} />

                      {/* Tenants */}
                      <Route path="/tenants" element={<TenantsList />} />
                      <Route path="/tenants/:id" element={<TenantDetail />} />
                      <Route path="/tenants/invite" element={<InviteTenant />} />

                      {/* Documents */}
                      <Route path="/documents" element={<DocumentsList />} />
                      <Route path="/documents/upload" element={<UploadDocument />} />

                      {/* Compliance */}
                      <Route path="/compliance" element={<ComplianceAlerts />} />

                      {/* Maintenance */}
                      <Route path="/maintenance" element={<MaintenanceList />} />
                      <Route path="/maintenance/:id" element={<MaintenanceDetail />} />

                      {/* Default Redirect */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
