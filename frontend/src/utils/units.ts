/**
 * Unit formatting and conversion utilities for Desludge Digital Twin
 */

export function formatFlowRate(m3h: number): string {
  return `${m3h.toFixed(1)} m³/h`;
}

export function formatPressureKpa(kpa: number): string {
  return `${kpa.toFixed(1)} kPa`;
}

export function formatPressureBar(bar: number): string {
  return `${bar.toFixed(2)} bar`;
}

export function formatVolume(liters: number): string {
  if (liters >= 1000) {
    return `${(liters / 1000).toFixed(2)} m³ (${Math.round(liters)} L)`;
  }
  return `${Math.round(liters)} L`;
}

export function formatPower(kw: number): string {
  return `${kw.toFixed(2)} kW`;
}

export function formatCurrent(amps: number): string {
  return `${amps.toFixed(1)} A`;
}

export function formatTemp(celsius: number): string {
  return `${celsius.toFixed(1)} °C`;
}

export function formatPpm(ppm: number): string {
  return `${ppm.toFixed(1)} ppm`;
}

export function formatPercent(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

export function formatVibration(mms: number): string {
  return `${mms.toFixed(2)} mm/s`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getStatusColor(status: string): { bg: string; text: string; border: string; dot: string } {
  switch (status.toLowerCase()) {
    case 'running':
    case 'nominal':
    case 'success':
      return {
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-400',
        border: 'border-emerald-600/50',
        dot: 'bg-emerald-400'
      };
    case 'warning':
    case 'paused':
      return {
        bg: 'bg-amber-950/60',
        text: 'text-amber-400',
        border: 'border-amber-600/50',
        dot: 'bg-amber-400'
      };
    case 'alarm':
    case 'critical':
      return {
        bg: 'bg-rose-950/60',
        text: 'text-rose-400',
        border: 'border-rose-600/50',
        dot: 'bg-rose-500'
      };
    case 'complete':
      return {
        bg: 'bg-cyan-950/60',
        text: 'text-cyan-400',
        border: 'border-cyan-600/50',
        dot: 'bg-cyan-400'
      };
    case 'idle':
    default:
      return {
        bg: 'bg-slate-800/60',
        text: 'text-slate-400',
        border: 'border-slate-700/50',
        dot: 'bg-slate-500'
      };
  }
}
