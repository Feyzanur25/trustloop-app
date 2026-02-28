import { Routes, Route } from "react-router-dom";
import AppLayout from "./ui/AppLayout";

import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import LoopDetail from "./pages/LoopDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/loops/:id" element={<LoopDetail />} />
      </Route>
    </Routes>
  );
}
