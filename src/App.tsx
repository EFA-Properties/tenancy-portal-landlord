import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import TenanciesList from './pages/tenancies/TenanciesList'
import TenancyDetail from './pages/tenancies/TenancyDetail'
import AddTenancy from './pages/tenancies/AddTenancy'
import DocumentsList from './pages/documents/DocumentsList'
import UploadDocument from './pages/documents/UploadDocument'
import MaintenanceList from './pages/maintenance/MaintenanceList'
import MaintenanceDetail from './pages/maintenance/MaintenanceDetail'
import PropertiesList from './pages/properties/PropertiesList'
import PropertyDetail from './pages/properties/PropertyDetail'
import AddProperty from './pages/properties/AddProperty'
import TenantsList from './pages/tenants/TenantsList'
import TenantDetail from './pages/tenants/TenantDetail'
import InviteTenant from './pages/tenants/InviteTenant'
import ComplianceAlerts from './pages/compliance/ComplianceAlerts'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tenancies"
          element={
            <ProtectedRoute>
              <Layout>
                <TenanciesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenancies/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TenancyDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenancies/new"
          element={
            <ProtectedRoute>
              <Layout>
                <AddTenancy />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/properties"
          element={
            <ProtectedRoute>
              <Layout>
                <PropertiesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PropertyDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/properties/new"
          element={
            <ProtectedRoute>
              <Layout>
                <AddProperty />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <DocumentsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <UploadDocument />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <Layout>
                <MaintenanceList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <MaintenanceDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tenants"
          element={
            <ProtectedRoute>
              <Layout>
                <TenantsList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TenantDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tenants/invite"
          element={
            <ProtectedRoute>
              <Layout>
                <InviteTenant />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/compliance"
          element={
            <ProtectedRoute>
              <Layout>
                <ComplianceAlerts />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
