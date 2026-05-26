import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Recap from "./pages/Recap";
import Insights from "./pages/Insights";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/tasks"    element={<Tasks />} />
          <Route path="/recap"    element={<Recap />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
