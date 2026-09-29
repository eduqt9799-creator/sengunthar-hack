import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChecklistModal from './components/ChecklistModal';
import DashboardPage from './pages/DashboardPage';
import ProductManagementPage from './pages/ProductManagementPage';
import BatchManagementPage from './pages/BatchManagementPage';
import NewInspectionPage from './pages/NewInspectionPage';
import BatchReportPage from './pages/BatchReportPage';
import AlertsCenterPage from './pages/AlertsCenterPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CorrectiveActionsPage from './pages/CorrectiveActionsPage';
import QRScannerPage from './pages/QRScannerPage';
import { AlertService } from './services/api';

export default function App() {
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  const fetchAlertCount = async () => {
    try {
      const res = await AlertService.getAll('OPEN');
      setActiveAlerts(res.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="flex min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Sidebar */}
        <Sidebar
          activeAlertCount={activeAlerts}
          onOpenChecklist={() => setIsChecklistOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            activeAlertCount={activeAlerts}
            onRefresh={fetchAlertCount}
          />

          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductManagementPage />} />
              <Route path="/batches" element={<BatchManagementPage />} />
              <Route path="/batches/:batchId" element={<BatchReportPage />} />
              <Route path="/inspect" element={<NewInspectionPage />} />
              <Route path="/alerts" element={<AlertsCenterPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/corrective-actions" element={<CorrectiveActionsPage />} />
              <Route path="/scan" element={<QRScannerPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* 15-Point Product Validation Roadmap Checklist Modal */}
        <ChecklistModal
          isOpen={isChecklistOpen}
          onClose={() => setIsChecklistOpen(false)}
        />
      </div>
    </Router>
  );
}
