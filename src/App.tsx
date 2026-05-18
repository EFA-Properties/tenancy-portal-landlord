import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

// Auth pages — eagerly loaded (small, needed immediately)
import Login from './pages/Login'
import Register from './pages/Register'
import ResetPassword from './pages/ResetPassword'

// Everything else — lazy loaded (only fetched when navigated to)
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Payment = lazy(() => import('./pages/Payment'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const TenanciesList = lazy(() => import('./pages/tenancies/TenanciesList'))
const TenancyDetail = lazy(() => import('./pages/tenancies/TenancyDetail'))
const AddTenancy = lazy(() => import('./pages/tenancies/AddTenancy'))
const DocumentsList = lazy(() => import('./pages/documents/DocumentsList'))
const UploadDocument = lazy(() => import('./pages/documents/UploadDocument'))
const MaintenanceList = lazy(() => import('./pages/maintenance/MaintenanceList'))
const MaintenanceDetail = lazy(() => import('./pages/maintenance/MaintenanceDetail'))
const PropertiesList = lazy(() => import('./pages/properties/PropertiesList'))
const PropertyDetail = lazy(() => import('./pages/properties/PropertyDetail'))
const AddProperty = lazy(() => import('./pages/properties/AddProperty'))
const TenantsList = lazy(() => import('./pages/tenants/TenantsList'))
const TenantDetail = lazy(() => import('./pages/tenants/TenantDetail'))
const InviteTenant = lazy(() => import('./pages/tenants/InviteTenant'))
const ComplianceAlerts = lazy(() => import('./pages/compliance/ComplianceAlerts'))
const MessagesList = lazy(() => import('./pages/messages/MessagesList'))
const MessageThread = lazy(() => import('./pages/messages/MessageThread'))
const AgreementsList = lazy(() => import('./pages/tenancies/AgreementsList'))
const CreateAgreement = lazy(() => import('./pages/tenancies/CreateAgreement'))
const AgreementView = lazy(() => import('./pages/tenancies/AgreementView'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
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
            path="/tenancies/:tenancyId/agreements"
            element={
              <ProtectedRoute>
                <Layout>
                  <AgreementsList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenancies/:tenancyId/agreements/new"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateAgreement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tenancies/:tenancyId/agreements/:agreementId"
            element={
              <ProtectedRoute>
                <Layout>
                  <AgreementView />
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
            path="/messages"
            element={
              <ProtectedRoute>
                <Layout>
                  <MessagesList />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages/:tenancyId"
            element={
              <ProtectedRoute>
                <Layout>
                  <MessageThread />
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
      </Suspense>
    </BrowserRouter>
  )
}
