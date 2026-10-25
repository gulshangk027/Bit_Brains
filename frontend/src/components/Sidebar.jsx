import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  Megaphone, 
  AlertTriangle, 
  Network, 
  BarChart3, 
  FileText, 
  BookOpen, 
  Settings, 
  Home,
  Building2,
  Landmark
} from 'lucide-react';

export default function Sidebar({ currentView, setCurrentView, alertCount = 0 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home, badge: null },
    { id: 'rakshak', label: '01. RAKSHAK (Prevent)', icon: ShieldCheck, badge: 'PREVENT' },
    { id: 'drishthi', label: '02. DRISHTHI (Detect)', icon: Search, badge: 'ML MAIN', highlight: true },
    { id: 'awaaz', label: '03. AWAAZ (Respond)', icon: Megaphone, badge: 'RESPOND' },
    { id: 'alerts', label: 'Risk Alerts', icon: AlertTriangle, badge: String(alertCount ?? 0) },
    { id: 'networks', label: 'Mule Networks', icon: Network, badge: 'GRAPH' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'reports', label: 'Reports', icon: FileText, badge: null },
    { id: 'dictionary', label: 'Feature Dictionary', icon: BookOpen, badge: '18 BANK' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  return (
    <aside className="w-[280px] shrink-0 bg-white border-r border-[#DCE5EF] flex flex-col h-screen sticky top-0 z-30 font-sans shadow-2xs">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#DCE5EF] flex items-center gap-3.5 bg-white">
        <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] border border-[#DCE5EF] flex items-center justify-center shrink-0">
          <Landmark className="w-5 h-5 text-[#1268C4]" />
        </div>
        <div>
          <h1 className="font-extrabold tracking-wider text-base text-[#102B52]">
            MULENET <span className="text-[#1268C4]">AI</span>
          </h1>
          <p className="text-[10px] text-[#60748A] font-bold tracking-widest uppercase mt-0.5">
            Prevent • Detect • Respond
          </p>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1 bg-white">
        <div className="px-3 py-2 text-[10px] font-extrabold text-[#60748A] uppercase tracking-wider">
          Platform Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#EBF3FA] text-[#102B52] font-bold border-l-4 border-[#1268C4] shadow-2xs'
                  : 'text-[#60748A] hover:bg-[#F6F9FC] hover:text-[#102B52] font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#1268C4]' : 'text-[#60748A]'}`} />
                <span className={isActive ? 'text-[#102B52] font-extrabold' : ''}>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    isActive
                      ? 'bg-[#1268C4] text-white'
                      : item.highlight
                      ? 'bg-[#EBF3FA] text-[#1268C4] border border-[#DCE5EF]'
                      : item.id === 'alerts'
                      ? 'bg-[#FFFBEB] text-[#D98B00] border border-[#FDE68A] font-mono'
                      : 'bg-[#F6F9FC] text-[#60748A] border border-[#DCE5EF]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-[#DCE5EF] bg-[#F8FAFC]">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[#60748A] text-[11px] font-medium">Banking System Status</span>
          <span className="flex items-center gap-1.5 text-[#168A5B] font-bold text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#168A5B]"></span>
            ONLINE
          </span>
        </div>
        <div className="text-[10px] text-[#60748A] flex justify-between font-mono">
          <span>AI Fraud Engine</span>
          <span>v1.0.4</span>
        </div>
      </div>
    </aside>
  );
}
