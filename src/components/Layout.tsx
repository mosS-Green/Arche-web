import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, User as UserIcon, X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { PersonalDashboard } from './PersonalDashboard';
import { WorkWorkspace } from './WorkWorkspace';
import { registerPlugin } from '@capacitor/core';
import { SmartCaptureModal } from './SmartCaptureModal';

export interface IntentData {
  type: 'none' | 'qs_camera' | 'share';
  mimeType?: string;
  text?: string;
  imageUri?: string;
  imageBase64?: string;
}

export interface IntentHandlerPlugin {
  getLaunchIntent(): Promise<IntentData>;
  clearIntent(): Promise<void>;
}

const IntentHandler = registerPlugin<IntentHandlerPlugin>('IntentHandler');

export const Layout: React.FC = () => {
  const { profile, toasts, removeToast } = useApp();
  const [currentTab, setCurrentTab] = useState<'personal' | 'work'>('personal');
  const [isSmartCaptureOpen, setIsSmartCaptureOpen] = useState(false);
  const [activeIntent, setActiveIntent] = useState<IntentData | null>(null);

  const username = profile?.display_name || 'Personal';

  useEffect(() => {
    const handleIntent = (intent: IntentData) => {
      if (intent && intent.type !== 'none') {
        setActiveIntent(intent);
        setIsSmartCaptureOpen(true);
      }
    };

    // Check launch intent on startup
    const checkLaunchIntent = async () => {
      try {
        const intent = await IntentHandler.getLaunchIntent();
        if (intent && intent.type !== 'none') {
          handleIntent(intent);
          await IntentHandler.clearIntent();
        }
      } catch (e) {
        console.warn('Failed to fetch launch intent:', e);
      }
    };
    
    checkLaunchIntent();

    // Listen for intents while the app is active/backgrounded
    const listener = (IntentHandler as any).addListener('onNewIntent', async (intent: IntentData) => {
      if (intent && intent.type !== 'none') {
        handleIntent(intent);
        await IntentHandler.clearIntent();
      }
    });

    return () => {
      listener.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink-primary flex flex-col md:flex-row relative">
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[100] max-w-sm w-full space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.3 }}
              className="bg-surface border border-surface/80 rounded-xl p-4 shadow-xl flex items-start gap-3 pointer-events-auto backdrop-blur-md"
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-accent-work" />}
                {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-danger" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-accent-personal" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-display font-medium text-ink-primary">{toast.title}</p>
                {toast.message && <p className="text-xs text-ink-secondary mt-1 font-light">{toast.message}</p>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-full text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex md:w-64 bg-surface/20 border-r border-surface/60 flex-col justify-between shrink-0 h-screen sticky top-0 py-8 px-6">
        <div className="space-y-12">
          {/* Logo / Header */}
          <div className="flex items-center gap-2">
            <span className="font-display font-bold tracking-widest text-lg uppercase text-ink-primary select-none">
              Arché
            </span>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-2">
            {/* Personal Tab */}
            <button
              onClick={() => setCurrentTab('personal')}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-display tracking-wide font-light transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                currentTab === 'personal'
                  ? 'text-accent-personal font-medium bg-surface/50 border-l-2 border-accent-personal pl-3'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-surface/20'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span className="truncate">{username}</span>
            </button>

            {/* Work Tab */}
            <button
              onClick={() => setCurrentTab('work')}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-display tracking-wide font-light transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                currentTab === 'work'
                  ? 'text-accent-work font-medium bg-surface/50 border-l-2 border-accent-work pl-3'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-surface/20'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Work</span>
            </button>
          </nav>
        </div>

        {/* Profile Card */}
        <div className="border-t border-surface/50 pt-6">
          <div className="min-w-0">
            <p className="text-xs font-mono text-ink-muted truncate uppercase tracking-wider">DOMAIN OWNER</p>
            <p className="text-sm font-display text-ink-primary truncate font-medium">{username}</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen md:overflow-y-auto">
        <div className="flex-1 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            {currentTab === 'personal' ? (
              <motion.div
                key="personal"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <PersonalDashboard />
              </motion.div>
            ) : (
              <motion.div
                key="work"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <WorkWorkspace />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Bar Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-lg border-t border-surface/60 px-4 py-3 z-30 flex items-center justify-around">
        {/* Personal Tab */}
        <button
          onClick={() => setCurrentTab('personal')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 min-w-[70px] transition-colors duration-300 cursor-pointer ${
            currentTab === 'personal' ? 'text-accent-personal' : 'text-ink-secondary'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-display font-medium tracking-wide truncate max-w-[80px]">{username}</span>
        </button>

        {/* Work Tab */}
        <button
          onClick={() => setCurrentTab('work')}
          className={`flex flex-col items-center gap-1.5 py-1 px-3 min-w-[70px] transition-colors duration-300 cursor-pointer ${
            currentTab === 'work' ? 'text-accent-work' : 'text-ink-secondary'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] font-display font-medium tracking-wide">Work</span>
        </button>

      </nav>

      {/* Smart Capture Modal for Intents */}
      <SmartCaptureModal
        isOpen={isSmartCaptureOpen}
        onClose={() => {
          setIsSmartCaptureOpen(false);
          setActiveIntent(null);
        }}
        initialIntent={activeIntent}
      />
    </div>
  );
};
