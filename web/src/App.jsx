import { Routes, Route } from "react-router-dom";
import AppLayout from "./ui/AppLayout";

import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import LoopDetail from "./pages/LoopDetail";
import Metrics from "./pages/Metrics";
import Monitoring from "./pages/Monitoring";
import Onboarding from "./pages/Onboarding";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/loops/:id" element={<LoopDetail />} />
      </Route>
    </Routes>
  );
}
