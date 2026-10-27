import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavItem } from './components/Sidebar';
import { DemoRole } from './types';
import { setDemoRole, api } from './services/api';

// Pages
import { Overview } from './pages/Overview';
import { ApplicationsList } from './pages/ApplicationsList';
import { ApplicationWorkspace } from './pages/ApplicationWorkspace';
import { ReviewQueue } from './pages/ReviewQueue';
import { Verification } from './pages/Verification';
import { InfrastructureReview } from './pages/InfrastructureReview';
import { Alerts } from './pages/Alerts';
import { RulesGovernance } from './pages/RulesGovernance';
import { CategoriesCatalogue } from './pages/CategoriesCatalogue';
import { DocumentsCatalogue } from './pages/DocumentsCatalogue';
import { CandidateRulesCatalogue } from './pages/CandidateRulesCatalogue';
import { ExternalRefsCatalogue } from './pages/ExternalRefsCatalogue';
import { CatalogueCoverage } from './pages/CatalogueCoverage';
import { ReportsAudit } from './pages/ReportsAudit';
import { UserManagement } from './pages/UserManagement';
import { ConnectorSettings } from './pages/ConnectorSettings';

export function App() {
  const [currentNav, setCurrentNav] = useState<NavItem>('overview');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<DemoRole>('scrutiny_officer');
  const [currentUsername, setCurrentUsername] = useState<string>('Officer A');
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);

  const fetchAlertsCount = async () => {
    try {
      const alerts = await api.getAlerts({ status: 'active' });
      setActiveAlertsCount(alerts.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (role: DemoRole) => {
    setCurrentRole(role);
    if (role === 'system_admin') {
      setCurrentUsername('Administrator (Admin)');
    } else if (role === 'senior_reviewer') {
      setCurrentUsername('Senior Reviewer (Review Authority)');
    } else {
      setCurrentUsername('Officer A (Scrutiny Officer)');
    }
    setDemoRole(role);
  };

  const handleOpenApplication = (appId: string) => {
    setSelectedAppId(appId);
    // Stay on current or switch to applications context
  };

  const handleBackToApps = () => {
    setSelectedAppId(null);
  };

  const handleSidebarNavigate = (nav: NavItem) => {
    setSelectedAppId(null);
    setCurrentNav(nav);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Global Persistent Header & Demo Role Switcher */}
      <Header
        currentRole={currentRole}
        currentUsername={currentUsername}
        onRoleChange={handleRoleChange}
        activeAlertsCount={activeAlertsCount}
        onNavigateToAlerts={() => handleSidebarNavigate('alerts')}
      />

      {/* 2. Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar */}
        <Sidebar
          currentNav={currentNav}
          onNavigate={handleSidebarNavigate}
          currentRole={currentRole}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Main Content Pane */}
        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
          <div className="w-full max-w-[1700px] mx-auto">
            {selectedAppId ? (
              <ApplicationWorkspace
                applicationId={selectedAppId}
                onBack={handleBackToApps}
                currentRole={currentRole}
              />
            ) : (
              <>
                {currentNav === 'overview' && (
                  <Overview
                    onOpenApplication={handleOpenApplication}
                    onNavigate={handleSidebarNavigate}
                  />
                )}
                {currentNav === 'applications' && (
                  <ApplicationsList onOpenApplication={handleOpenApplication} />
                )}
                {currentNav === 'review_queue' && (
                  <ReviewQueue
                    onOpenApplication={handleOpenApplication}
                    currentRole={currentRole}
                  />
                )}
                {currentNav === 'verification' && <Verification />}
                {currentNav === 'infrastructure' && <InfrastructureReview />}
                {currentNav === 'alerts' && (
                  <Alerts onOpenApplication={handleOpenApplication} />
                )}
                {currentNav === 'reports_audit' && <ReportsAudit />}

                {/* Handbook Catalogue Screens */}
                {currentNav === 'categories_catalogue' && (
                  <CategoriesCatalogue currentRole={currentRole} />
                )}
                {currentNav === 'documents_catalogue' && <DocumentsCatalogue />}
                {currentNav === 'candidate_rules' && (
                  <CandidateRulesCatalogue currentRole={currentRole} />
                )}
                {currentNav === 'external_refs' && <ExternalRefsCatalogue />}
                {currentNav === 'catalogue_coverage' && <CatalogueCoverage />}

                {/* Governance & Admin Screens */}
                {currentNav === 'rules_governance' && (
                  <RulesGovernance currentRole={currentRole} />
                )}
                {currentNav === 'user_management' && (
                  <UserManagement currentRole={currentRole} />
                )}
                {currentNav === 'connector_settings' && (
                  <ConnectorSettings currentRole={currentRole} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
