import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, DocumentTextIcon, BeakerIcon, ChartBarIcon, CalculatorIcon } from "@heroicons/react/24/outline";
import { getCalculationTrace } from "../services/api";
import { useThemeColors } from "../theme/useThemeColors";

interface TraceStep {
  name: string;
  description?: string;
  values: Record<string, any>;
  score?: number;
}

interface CalculationTrace {
  supplierId: string;
  supplierName?: string;
  timestamp?: string;
  steps: TraceStep[];
  finalScore?: number;
  pillarScores?: Record<string, number>;
}

interface CalculationTraceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string | number;
  supplierName?: string;
}

const CalculationTraceDrawer: React.FC<CalculationTraceDrawerProps> = ({
  isOpen,
  onClose,
  supplierId,
  supplierName,
}) => {
  const colors = useThemeColors();
  const [trace, setTrace] = useState<CalculationTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && supplierId) {
      loadTrace();
    }
  }, [isOpen, supplierId]);

  const loadTrace = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCalculationTrace(supplierId, { latest: true });
      setTrace(response.trace || response);
    } catch (err) {
      console.error("Error loading trace:", err);
      setError(err instanceof Error ? err.message : "Failed to load calculation trace");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "number") {
      // If value is between 0-1, show as percentage
      if (value >= 0 && value <= 1 && value !== 0 && value !== 1) {
        return `${(value * 100).toFixed(2)}%`;
      }
      return value.toFixed(2);
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const getStepIcon = (stepName: string) => {
    switch (stepName.toLowerCase()) {
      case "raw":
        return BeakerIcon;
      case "normalized":
        return CalculatorIcon;
      case "weighted":
        return ChartBarIcon;
      case "composite":
        return DocumentTextIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const getStepColor = (stepName: string) => {
    switch (stepName.toLowerCase()) {
      case "raw":
        return colors.accent;
      case "normalized":
        return colors.primary;
      case "weighted":
        return colors.secondary;
      case "composite":
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 shadow-2xl"
            style={{ backgroundColor: colors.background }}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div
                className="p-6 border-b flex items-center justify-between"
                style={{ borderColor: colors.accent + "30" }}
              >
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                    📊 Calculation Trace
                  </h2>
                  <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    {supplierName || `Supplier ${supplierId}`}
                  </p>
                  {trace?.steps && (
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      {trace.steps.length} calculation steps
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-opacity-20 transition-colors"
                  style={{ color: colors.text }}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
                      <p style={{ color: colors.textMuted }}>Loading calculation trace...</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 rounded-lg border mb-4" style={{ borderColor: colors.error, backgroundColor: colors.error + "10" }}>
                    <p style={{ color: colors.error }}>Error: {error}</p>
                  </div>
                )}

                {!loading && !error && trace && (
                  <div className="space-y-6">
                    {/* Final Score Summary */}
                    {trace.finalScore !== undefined && (
                      <div
                        className="p-4 rounded-lg border"
                        style={{ borderColor: colors.success + "40", backgroundColor: colors.success + "10" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold" style={{ color: colors.text }}>
                            Final Composite Score
                          </span>
                          <span className="text-3xl font-bold" style={{ color: colors.success }}>
                            {trace.finalScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Steps */}
                    {trace.steps && trace.steps.length > 0 ? (
                      <div className="space-y-4">
                        {trace.steps.map((step, index) => {
                          const Icon = getStepIcon(step.name);
                          const stepColor = getStepColor(step.name);
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-5 rounded-lg border"
                              style={{ borderColor: stepColor + "40", backgroundColor: colors.card }}
                            >
                              <div className="flex items-center mb-4">
                                <div
                                  className="p-2 rounded-lg mr-3"
                                  style={{ backgroundColor: stepColor + "20" }}
                                >
                                  <Icon className="h-6 w-6" style={{ color: stepColor }} />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold capitalize" style={{ color: stepColor }}>
                                    {step.name}
                                  </h3>
                                  {step.description && (
                                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                                      {step.description}
                                    </p>
                                  )}
                                </div>
                                {step.score !== undefined && (
                                  <div className="text-right">
                                    <div className="text-2xl font-bold" style={{ color: stepColor }}>
                                      {step.score.toFixed(1)}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Values Grid */}
                              {step.values && typeof step.values === "object" && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                  {Object.entries(step.values).map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="p-2 rounded border text-xs"
                                      style={{ borderColor: colors.accent + "20", backgroundColor: colors.inputBg }}
                                    >
                                      <div className="font-medium mb-1" style={{ color: colors.textMuted }}>
                                        {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                      </div>
                                      <div className="font-mono font-semibold" style={{ color: colors.text }}>
                                        {formatValue(value)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12" style={{ color: colors.textMuted }}>
                        <p>No calculation trace available for this supplier.</p>
                        <p className="text-sm mt-2">Run an assessment to generate a trace.</p>
                      </div>
                    )}

                    {/* Pillar Scores */}
                    {trace.pillarScores && (
                      <div
                        className="p-4 rounded-lg border mt-6"
                        style={{ borderColor: colors.accent + "40", backgroundColor: colors.card }}
                      >
                        <h3 className="font-semibold mb-3" style={{ color: colors.text }}>
                          Pillar Scores
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {Object.entries(trace.pillarScores).map(([pillar, score]) => (
                            <div key={pillar} className="text-center">
                              <div className="text-xs mb-1" style={{ color: colors.textMuted }}>
                                {pillar.charAt(0).toUpperCase() + pillar.slice(1)}
                              </div>
                              <div className="text-xl font-bold" style={{ color: colors.primary }}>
                                {typeof score === "number" ? score.toFixed(1) : "N/A"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CalculationTraceDrawer;

