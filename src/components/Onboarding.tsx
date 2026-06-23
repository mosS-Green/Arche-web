import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { onboardUser } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMsg('Please enter a display name to begin.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    
    const success = await onboardUser(displayName.trim());
    if (!success) {
      setErrorMsg('Could not save profile. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg text-ink-primary flex flex-col justify-between p-8 md:p-16 z-50 overflow-y-auto selection:bg-accent-personal selection:text-bg">
      {/* Header / Brand */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-2 select-none"
      >
        <span className="font-display font-semibold tracking-wider text-xl uppercase text-accent-personal flex items-center gap-1.5">
          <Sparkles className="w-5 h-5" /> Arché
        </span>
      </motion.div>

      {/* Main Form Area */}
      <div className="max-w-2xl w-full mx-auto my-auto py-12">
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Headline Typography */}
          <div className="space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-6xl font-light tracking-tight leading-none text-ink-primary text-wrap-balance"
            >
              How should we <br />
              <span className="font-normal italic text-accent-personal">address you?</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-ink-secondary text-base md:text-lg max-w-md font-light leading-relaxed"
            >
              This name will label your personal dashboard, dictate navigation cues, and contextualize your daily logs.
            </motion.p>
          </div>

          {/* Form Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <div className="relative group max-w-lg border-b border-ink-muted focus-within:border-accent-personal transition-colors duration-300">
              <input
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter display name"
                autoFocus
                maxLength={25}
                className="w-full bg-transparent py-4 text-2xl md:text-3xl font-display font-light text-ink-primary placeholder:text-ink-muted outline-none border-none select-text"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-ink-secondary hover:text-accent-personal hover:bg-surface transition-all duration-300 disabled:opacity-50"
                aria-label="Submit display name"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
            
            {errorMsg && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-danger text-sm font-mono"
              >
                {errorMsg}
              </motion.p>
            )}
          </motion.div>
        </form>
      </div>

      {/* Footer System Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono text-ink-muted border-t border-surface pt-6"
      >
        <span>FIRST-TIME SETUP</span>
        <span>ARCHÉ V1.0.0 // WEB CLIENT</span>
      </motion.div>
    </div>
  );
};
