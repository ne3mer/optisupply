import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import TestApp from "./TestApp";

function SimplifiedApp() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-50">
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/test" element={<TestApp />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default SimplifiedApp;
