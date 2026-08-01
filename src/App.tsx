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
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { WhatsAppDispatchModal } from './components/WhatsAppDispatchModal';
import { ResendDispatchModal } from './components/ResendDispatchModal';
import { TwilioVoiceDispatchModal } from './components/TwilioVoiceDispatchModal';
import { SideChatbot } from './components/SideChatbot';
import { UserRole, User } from './types';
import { getCurrentSession, signOut, onAuthStateChange, updateProfile } from './utils/auth';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [userRole, setUserRole] = useState<UserRole>('donor');
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedFeatureModal, setSelectedFeatureModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Apply dark mode class to root HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const result = await getCurrentSession();
      if (result.success && result.user) {
        setUserRole(result.user.role);
        setCurrentUser(result.user);
        setCurrentView('dashboard');
      }
      setIsLoading(false);
    };

    checkSession();

    // Set up auth state change listener
    const subscription = onAuthStateChange((user) => {
      if (user) {
        setUserRole(user.role);
        setCurrentUser(user);
        setCurrentView('dashboard');
      } else {
        setCurrentUser(undefined);
        setCurrentView('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignInSuccess = (role: UserRole, userDetails?: User) => {
    setUserRole(role);
    if (userDetails) {
      setCurrentUser(userDetails);
    }
    setCurrentView('dashboard');
  };

  const handleRegisterSuccess = (registeredUser: User) => {
    setUserRole(registeredUser.role);
    setCurrentUser(registeredUser);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const result = await updateProfile(updatedUser.id, updatedUser);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      return;
    }

    // Preserve the form state during a transient database failure so users do
    // not lose their edits; the next save will retry persistence.
    setCurrentUser(updatedUser);
  };

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(undefined);
    setCurrentView('landing');
  };

  // Show loading screen while checking auth session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is in Sign In view
  if (currentView === 'login') {
    return <><SignInView onSignInSuccess={handleSignInSuccess} onGoToRegister={() => setCurrentView('register')} onGoHome={() => setCurrentView('landing')} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /><SideChatbot /></>;
  }

  // If user is in Register view
  if (currentView === 'register') {
    return <><RegisterView onRegisterSuccess={handleRegisterSuccess} onGoToSignIn={() => setCurrentView('login')} onGoHome={() => setCurrentView('landing')} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} /><SideChatbot /></>;
  }

  // If user is logged in to a role dashboard (Admin, Hospital, Donor, Patient)
  if (currentView === 'dashboard') {
    return <><RoleDashboards
        role={userRole}
        user={currentUser}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onOpenEmergencyModal={() => setSelectedFeatureModal('emergency-assistant')}
        onOpenEligibilityModal={() => setSelectedFeatureModal('eligibility-ai')}
        onOpenVoiceAssistant={() => setSelectedFeatureModal('voice-assistant')}
        onOpenWhatsAppModal={() => setSelectedFeatureModal('whatsapp-dispatch')}
        onOpenResendModal={() => setSelectedFeatureModal('resend-dispatch')}
        onOpenTwilioVoiceModal={() => setSelectedFeatureModal('twilio-voice')}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <EmergencyAssistantModal
        isOpen={selectedFeatureModal === 'emergency-assistant'}
        onClose={() => setSelectedFeatureModal(null)}
      />
      <WhatsAppDispatchModal
        isOpen={selectedFeatureModal === 'whatsapp-dispatch'}
        onClose={() => setSelectedFeatureModal(null)}
      />
      <ResendDispatchModal
        isOpen={selectedFeatureModal === 'resend-dispatch'}
        onClose={() => setSelectedFeatureModal(null)}
      />
      <TwilioVoiceDispatchModal
        isOpen={selectedFeatureModal === 'twilio-voice'}
        onClose={() => setSelectedFeatureModal(null)}
      />
      <SideChatbot />
    </>;
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
        user={currentUser}
      />

      <ShortagePredictionModal
        isOpen={selectedFeatureModal === 'shortage-prediction'}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <VoiceAssistantModal
        isOpen={selectedFeatureModal === 'voice-assistant'}
        onClose={() => setSelectedFeatureModal(null)}
        handlers={{
          onOpenEmergency:   () => { setSelectedFeatureModal(null); setTimeout(() => setSelectedFeatureModal('emergency-assistant'), 50); },
          onOpenEligibility: () => { setSelectedFeatureModal(null); setTimeout(() => setSelectedFeatureModal('eligibility-ai'), 50); },
          onOpenShortage:    () => { setSelectedFeatureModal(null); setTimeout(() => setSelectedFeatureModal('shortage-prediction'), 50); },
          onClose:           () => setSelectedFeatureModal(null),
        }}
      />

      <WhatsAppDispatchModal
        isOpen={selectedFeatureModal === 'whatsapp-dispatch'}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <ResendDispatchModal
        isOpen={selectedFeatureModal === 'resend-dispatch'}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <TwilioVoiceDispatchModal
        isOpen={selectedFeatureModal === 'twilio-voice'}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <GenericFeatureModal
        featureId={selectedFeatureModal}
        onClose={() => setSelectedFeatureModal(null)}
      />

      <SideChatbot />

    </div>
  );
}
