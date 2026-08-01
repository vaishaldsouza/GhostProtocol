import React, { useState, useEffect } from 'react';
import { HeaderNavbar } from './components/HeaderNavbar';
import { HeroSection } from './components/HeroSection';
import { FeaturesSection } from './components/FeaturesSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { CtaBanner } from './components/CtaBanner';
import { FooterSection } from './components/FooterSection';
import { SignInView } from './components/SignInView';
import { RegisterView } from './components/RegisterView';
import { RoleDashboards } from './components/RoleDashboards';
import { EmergencyAssistantModal } from './components/EmergencyAssistantModal';
import { EligibilityAiModal } from './components/EligibilityAiModal';
import { ShortagePredictionModal } from './components/ShortagePredictionModal';
import { GenericFeatureModal } from './components/GenericFeatureModal';
import { UserRole } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [userRole, setUserRole] = useState<UserRole>('donor');
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFeatureModal, setSelectedFeatureModal] = useState<string | null>(null);

  // Apply dark mode class to root HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleSignInSuccess = (role: UserRole) => {
    setUserRole(role);
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = (role: UserRole) => {
    setUserRole(role);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('landing');
  };

  // If user is in Sign In view (Image 1)
  if (currentView === 'login') {
    return (
      <SignInView
        onSignInSuccess={handleSignInSuccess}
        onGoToRegister={() => setCurrentView('register')}
        onGoHome={() => setCurrentView('landing')}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  // If user is in Register view (Image 2)
  if (currentView === 'register') {
    return (
      <RegisterView
        onRegisterSuccess={handleRegisterSuccess}
        onGoToSignIn={() => setCurrentView('login')}
        onGoHome={() => setCurrentView('landing')}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  // If user is logged in to a role dashboard (Admin, Hospital, Donor)
  if (currentView === 'dashboard') {
    return (
      <RoleDashboards
        role={userRole}
        onLogout={handleLogout}
        onOpenEmergencyModal={() => setSelectedFeatureModal('emergency-assistant')}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
    );
  }

  // Main Landing Page (Image 4)
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Navbar */}
      <HeaderNavbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onOpenLogin={() => setCurrentView('login')}
        onOpenRegister={() => setCurrentView('register')}
        onOpenEmergency={() => setSelectedFeatureModal('emergency-assistant')}
      />

      {/* Main Content Area */}
      <main className="flex-grow">
        
        {/* Hero Section */}
        <HeroSection
          onStartSavingLives={() => setCurrentView('register')}
          onWatchDemo={() => setSelectedFeatureModal('emergency-assistant')}
        />

        {/* Features Section */}
        <FeaturesSection
          onSelectFeature={(featureId) => setSelectedFeatureModal(featureId)}
        />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* About Us Section */}
        <AboutSection />

        {/* CTA Banner */}
        <CtaBanner
          onRegister={() => setCurrentView('register')}
        />

        {/* Contact Section */}
        <ContactSection />

      </main>

      {/* Footer */}
      <FooterSection
        onGoHome={() => setActiveTab('home')}
        onOpenLogin={() => setCurrentView('login')}
        onOpenRegister={() => setCurrentView('register')}
        onOpenEmergency={() => setSelectedFeatureModal('emergency-assistant')}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Interactive AI Modals */}
      <EmergencyAssistantModal
        isOpen={selectedFeatureModal === 'emergency-assistant'}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <EligibilityAiModal
        isOpen={selectedFeatureModal === 'eligibility-ai'}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <ShortagePredictionModal
        isOpen={selectedFeatureModal === 'shortage-prediction'}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <GenericFeatureModal
        featureId={selectedFeatureModal}
        onClose={() => setSelectedFeatureModal(null)}
      />

    </div>
  );
}
