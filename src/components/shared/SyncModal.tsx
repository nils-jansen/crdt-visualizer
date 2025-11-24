import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SyncStep, CmRDTSyncStep } from '../../types/crdt';

type AnyStep = SyncStep | CmRDTSyncStep;

interface SyncModalProps {
  isOpen: boolean;
  steps: AnyStep[];
  sourceLabel: string;
  targetLabel: string;
  onComplete: () => void;
  onClose: () => void;
  children: (step: AnyStep, stepIndex: number) => React.ReactNode;
  applyLabel?: string;
  title?: string;
}

export function SyncModal({
  isOpen,
  steps,
  sourceLabel,
  targetLabel,
  onComplete,
  onClose,
  children,
  applyLabel = 'Apply Merge',
  title = 'Syncing Replicas',
}: SyncModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsAutoPlaying(false);
    }
  }, [isOpen]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsAutoPlaying(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep, steps.length, isOpen]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSkipToEnd = useCallback(() => {
    setCurrentStep(steps.length - 1);
    setIsAutoPlaying(false);
  }, [steps.length]);

  const handleApply = useCallback(() => {
    onComplete();
    onClose();
  }, [onComplete, onClose]);

  if (!isOpen || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Safety check: if step is undefined, return null
  if (!step) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-4xl bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {title}
                </h2>
                <p className="text-sm text-slate-400">
                  {sourceLabel} → {targetLabel}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Step indicator */}
                <div className="flex items-center gap-2">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === currentStep
                          ? 'bg-blue-500 w-6'
                          : idx < currentStep
                          ? 'bg-green-500'
                          : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-400">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Step title and description */}
          <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
            <motion.h3
              key={step.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold text-white mb-1"
            >
              {step.title}
            </motion.h3>
            <motion.p
              key={`${step.id}-desc`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-slate-400"
            >
              {step.description}
            </motion.p>
          </div>

          {/* Content area - render step-specific visualization */}
          <div className="p-6 min-h-[300px] max-h-[400px] overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {children(step, currentStep)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isAutoPlaying
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {isAutoPlaying ? 'Pause' : 'Auto-play'}
              </button>
              <button
                onClick={handleSkipToEnd}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 hover:bg-slate-600 rounded text-sm font-medium transition-colors"
              >
                Skip to End
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Previous
              </button>
              {isLastStep ? (
                <motion.button
                  onClick={handleApply}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {applyLabel}
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
