import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import NavigationBar from "./components/Navbar";
// import LandingPage from "./pages/LandingPage"; // Unused component
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import EvaluateSupplier from "./pages/EvaluateSupplier";
import Recommendations from "./pages/Recommendations";
import SuppliersList from "./pages/SuppliersList";
import SupplierDetails from "./pages/SupplierDetails";
import SupplierScorecard from "./pages/SupplierScorecard";
import AddSupplier from "./pages/AddSupplier";
import SupplierAnalytics from "./pages/SupplierAnalytics";
import SupplierAssessment from "./pages/enhanced/SupplierAssessment";
import { lazy, Suspense } from "react";
const GeoRiskMapping = lazy(() => import("./pages/GeoRiskMapping"));
const SupplyChainGraph = lazy(() => import("./pages/SupplyChainGraph"));
import AboutMethodology from "./pages/AboutMethodology";
import SupplierEditForm from "./pages/SupplierEditForm";
import Methodology from "./pages/Methodology";
import { useEffect } from "react";
import { RecoilRoot } from "recoil";
import { ReactFlowProvider } from "reactflow";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Settings from "./pages/Settings";
import Scenarios from "./pages/Scenarios";
import NotFound from "./pages/NotFound";

// Redirect component for suppliers/:id to supplier-details/:id
const SupplierRedirect = () => {
  const { id } = useParams();
  return <Navigate replace to={`/supplier-details/${id}`} />;
};

// Redirect component for suppliers/:id/scorecard to supplier-scorecard/:id
const ScorecardRedirect = () => {
  const { id } = useParams();
  return <Navigate replace to={`/supplier-scorecard/${id}`} />;
};

// Redirect component for supplier-analytics/:id to suppliers/:id/analytics
const SupplierAnalyticsRedirect = () => {
  const { id } = useParams();
  return <Navigate replace to={`/suppliers/${id}/analytics`} />;
};

// Add a component that will redirect to the 3D visualization
const Redirect3D = () => {
  useEffect(() => {
    window.location.href = "/index.html";
  }, []);
  return <div>Redirecting...</div>;
};

function App() {
  return (
    <ThemeProvider>
      <RecoilRoot>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              {/* Public Landing Page - No Navigation Bar */}
              <Route path="/" element={<HomePage />} />

              {/* Protected App Routes - With Navigation Bar */}
              <Route
                path="/*"
                element={
                  <>
                    <NavigationBar />
                    <main id="main-content" className="pt-16">
                      <Routes>
                        <Route path="/" element={<Layout />}>
                          <Route index element={<Dashboard />} />
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route path="suppliers" element={<SuppliersList />} />
                          <Route
                            path="suppliers/add"
                            element={<AddSupplier />}
                          />
                          <Route
                            path="suppliers/:id"
                            element={<SupplierDetails />}
                          />
                          <Route
                            path="suppliers/:id/edit"
                            element={<SupplierEditForm />}
                          />
                          <Route
                            path="suppliers/:id/scorecard"
                            element={<SupplierScorecard />}
                          />
                          <Route
                            path="suppliers/:id/analytics"
                            element={<SupplierAnalytics />}
                          />
                          <Route
                            path="supplier-analytics/:id"
                            element={<SupplierAnalyticsRedirect />}
                          />
                          <Route
                            path="suppliers/:id/assessment"
                            element={<SupplierAssessment />}
                          />
                          <Route
                            path="suppliers/evaluate"
                            element={<EvaluateSupplier />}
                          />
                          <Route
                            path="recommendations"
                            element={<Recommendations />}
                          />
                          <Route
                            path="supply-chain-graph"
                            element={
                              <Suspense fallback={<div className="p-8">Loading 3D graph…</div>}>
                                <ReactFlowProvider>
                                  <SupplyChainGraph />
                                </ReactFlowProvider>
                              </Suspense>
                            }
                          />
                          <Route
                            path="geo-risk-mapping"
                            element={
                              <Suspense fallback={<div className="p-8">Loading globe…</div>}>
                                <GeoRiskMapping />
                              </Suspense>
                            }
                          />
                          <Route path="about" element={<AboutMethodology />} />
                          <Route path="methodology" element={<Methodology />} />
                          <Route
                            path="3d-visualization"
                            element={<Redirect3D />}
                          />
                          <Route path="settings" element={<Settings />} />
                          <Route path="scenarios" element={<Scenarios />} />
                          <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </main>
                  </>
                }
              />
            </Routes>
          </div>
        </Router>
        <Toaster position="top-right" />
      </RecoilRoot>
    </ThemeProvider>
  );
}

export default App;
