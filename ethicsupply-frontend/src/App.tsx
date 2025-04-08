import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import NavigationBar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import EvaluateSupplier from "./pages/EvaluateSupplier";
import Recommendations from "./pages/Recommendations";
import SuppliersList from "./pages/SuppliersList";
import SupplierDetails from "./pages/SupplierDetails";
import SupplierScorecard from "./pages/SupplierScorecard";
import AddSupplier from "./pages/AddSupplier";
import SupplierAnalytics from "./pages/SupplierAnalytics";
import SupplierAssessment from "./pages/enhanced/SupplierAssessment";
import GeoRiskMapping from "./pages/GeoRiskMapping";
import SupplyChainGraph from "./pages/SupplyChainGraph";
import About from "./pages/About";
import SupplierEditForm from "./pages/SupplierEditForm";
import { useEffect } from "react";

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

// Add a component that will redirect to the 3D visualization
const Redirect3D = () => {
  useEffect(() => {
    window.location.href = "/index.html";
  }, []);
  return <div>Redirecting...</div>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50">
        <NavigationBar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/suppliers" element={<SuppliersList />} />
            <Route path="/supplier-details/:id" element={<SupplierDetails />} />
            <Route path="/suppliers/:id" element={<SupplierRedirect />} />
            <Route
              path="/suppliers/:id/scorecard"
              element={<ScorecardRedirect />}
            />
            <Route path="/evaluate-supplier" element={<EvaluateSupplier />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route
              path="/supplier-scorecard/:id?"
              element={<SupplierScorecard />}
            />
            <Route
              path="/supplier-analytics/:id?"
              element={<SupplierAnalytics />}
            />
            <Route path="/add-supplier" element={<AddSupplier />} />
            <Route
              path="/supplier-assessment"
              element={<SupplierAssessment />}
            />
            <Route path="/geo-risk-mapping" element={<GeoRiskMapping />} />
            <Route path="/supply-chain-graph" element={<SupplyChainGraph />} />
            <Route path="/about" element={<About />} />
            <Route path="/3d-visualization" element={<Redirect3D />} />
            <Route path="/suppliers/edit/:id" element={<SupplierEditForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
