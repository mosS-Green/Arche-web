import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Onboarding } from './components/Onboarding';
import { Layout } from './components/Layout';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isLoading, isOnboardingRequired } = useApp();

  // 1. Loading State (Aesthetic splash screen)
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg text-ink-primary flex flex-col items-center justify-center z-50 select-none">
        <div className="flex flex-col items-center space-y-4">
          <Sparkles className="w-8 h-8 text-accent-personal animate-pulse" />
          <span className="font-display font-semibold tracking-widest text-lg uppercase text-ink-primary">
            Arché
          </span>
          <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest animate-pulse">
            Configuring Domain...
          </span>
        </div>
      </div>
    );
  }

  // 2. Onboarding State (First-launch display name or lookup)
  if (isOnboardingRequired) {
    return <Onboarding />;
  }

  // 3. Main App layout
  return <Layout />;
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
