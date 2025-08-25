import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Records from "./pages/Records";
import Reports from "./pages/Reports";
import VehicleDetail from "./pages/VehicleDetail";

import "./index.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/records" element={<Records />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  </React.StrictMode>
);
