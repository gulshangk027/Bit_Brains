import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import OverviewView from './components/OverviewView';
import RakshakView from './components/RakshakView';
import DrishthiView from './components/DrishthiView';
import AwaazView from './components/AwaazView';
import AlertsView from './components/AlertsView';
import NetworksView from './components/NetworksView';
import AnalyticsView from './components/AnalyticsView';
import ReportsView from './components/ReportsView';
import DictionaryView from './components/DictionaryView';
import SettingsView from './components/SettingsView';

export default function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [datasetSummary, setDatasetSummary] = useState(null);
  const [isMlMode, setIsMlMode] = useState(true);
  const [isModelTrained, setIsModelTrained] = useState(true);
  const [trainedMetrics, setTrainedMetrics] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedAccountNav, setSelectedAccountNav] = useState(null);

  const fetchDatasetSummary = async () => {
    try {
      const res = await fetch('/api/dataset/summary');
      const data = await res.json();
      setDatasetSummary(data);
    } catch (err) {
      console.error('Failed to fetch dataset summary:', err);
    }
  };

  const checkModelStatus = async () => {
    try {
      const res = await fetch('/api/model/status');
      const data = await res.json();
      if (data.is_trained) {
        setIsModelTrained(true);
        if (data.metrics) setTrainedMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to check model status:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  useEffect(() => {
    fetchDatasetSummary();
    checkModelStatus();
    fetchAlerts();
  }, []);

  const handleGlobalRefresh = () => {
    fetchDatasetSummary();
    checkModelStatus();
    fetchAlerts();
  };

  const handleToggleMlMode = async () => {
    setNoticeMessage(null);
    if (isMlMode) {
      setIsMlMode(false);
    } else {
      if (!isModelTrained) {
        try {
          const res = await fetch('/api/model/status');
          const data = await res.json();
          if (data.is_trained) {
            setIsModelTrained(true);
            if (data.metrics) setTrainedMetrics(data.metrics);
            setIsMlMode(true);
            return;
          }
        } catch (err) {
          console.error(err);
        }
        setNoticeMessage("Train the Drishthi model in Settings first.");
        setTimeout(() => setNoticeMessage(null), 4000);
      } else {
        setIsMlMode(true);
      }
    }
  };

  const handleNavigateToAccount = (accountId) => {
    if (accountId) {
      setSelectedAccountNav({ id: accountId, timestamp: Date.now() });
    }
    setCurrentView('drishthi');
  };

  return (
    <div className="flex min-h-screen bg-[#F6F9FC] text-[#102B52] font-sans antialiased selection:bg-[#1268C4] selection:text-white">
      {/* Global Navigation Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        alertCount={alerts.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Header */}
        <Header
          isMlMode={isMlMode}
          isModelTrained={isModelTrained}
          datasetSummary={datasetSummary}
          onUploadClick={() => setCurrentView('settings')}
          onDemoModeToggle={handleToggleMlMode}
          noticeMessage={noticeMessage}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'overview' && (
            <OverviewView datasetSummary={datasetSummary} onNavigate={setCurrentView} />
          )}

          {currentView === 'rakshak' && <RakshakView />}

          {currentView === 'drishthi' && (
            <DrishthiView initialAccount={selectedAccountNav} onNavigate={setCurrentView} onSelectAccount={handleNavigateToAccount} />
          )}

          {currentView === 'awaaz' && <AwaazView />}

          {currentView === 'alerts' && (
            <AlertsView 
              alerts={alerts}
              onRefreshAlerts={handleGlobalRefresh}
              onNavigateToAccount={handleNavigateToAccount} 
            />
          )}

          {currentView === 'networks' && (
            <NetworksView onSelectAccount={handleNavigateToAccount} />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView datasetSummary={datasetSummary} />
          )}

          {currentView === 'reports' && <ReportsView initialAccount={selectedAccountNav} />}

          {currentView === 'dictionary' && <DictionaryView />}

          {currentView === 'settings' && (
            <SettingsView
              datasetSummary={datasetSummary}
              onRefreshDataset={handleGlobalRefresh}
              isModelTrained={isModelTrained}
              setIsModelTrained={setIsModelTrained}
              trainedMetrics={trainedMetrics}
              setTrainedMetrics={setTrainedMetrics}
            />
          )}
        </main>
      </div>
    </div>
  );
}
