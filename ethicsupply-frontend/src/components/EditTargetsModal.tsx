import React, { useEffect, useState } from "react";
import { Targets, defaultTargets } from "../config/targets";

type Props = {
  open: boolean;
  onClose: () => void;
  value?: Targets;
  onSave?: (t: Targets) => void;
  onReset?: () => void;
  colors?: { panel: string; accent: string; text: string; textMuted: string; primary?: string };
};

const STORAGE_KEY = "targetsOverride";

const EditTargetsModal: React.FC<Props> = ({ open, onClose, value, onSave, onReset, colors }) => {
  const c = colors || { panel: "#1a2035", accent: "#4D5BFF", text: "#E0E0FF", textMuted: "#8A94C8", primary: "#00F0FF" };
  const [form, setForm] = useState<Targets>(value || defaultTargets);

  useEffect(() => {
    setForm(value || defaultTargets);
  }, [value]);

  const update = (k: keyof Targets, v: string) => {
    const num = Number(v);
    setForm((prev) => ({ ...prev, [k]: Number.isFinite(num) ? num : (prev[k] as number) }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
    onSave && onSave(form);
    onClose();
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onReset && onReset();
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div className="relative w-[95%] max-w-md rounded-lg border p-5" style={{ backgroundColor: c.panel, borderColor: c.accent + "40" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold" style={{ color: c.text }}>Edit Targets</h3>
          <button className="text-sm" style={{ color: c.textMuted }} onClick={onClose}>Close</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm block mb-1" style={{ color: c.textMuted }}>Renewable Energy Target (%)</label>
            <input type="number" min={0} max={100} step={1} value={form.renewablePct}
              onChange={(e)=>update('renewablePct', e.target.value)}
              className="w-full px-3 py-2 rounded border bg-transparent"
              style={{ color: c.text, borderColor: c.accent + '40' }} />
          </div>
          <div>
            <label className="text-sm block mb-1" style={{ color: c.textMuted }}>Injury Rate Target</label>
            <input type="number" min={0} step={0.1} value={form.injuryRate}
              onChange={(e)=>update('injuryRate', e.target.value)}
              className="w-full px-3 py-2 rounded border bg-transparent"
              style={{ color: c.text, borderColor: c.accent + '40' }} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={handleReset}
            className="text-sm underline"
            style={{ color: c.textMuted }}
          >
            Reset to defaults
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded border" style={{ color: c.text, borderColor: c.accent + '40' }}>Cancel</button>
            <button onClick={handleSave} className="px-3 py-1.5 text-sm rounded border" style={{ color: c.text, borderColor: c.accent, backgroundColor: (c.primary || '#00F0FF') + '22' }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTargetsModal;
