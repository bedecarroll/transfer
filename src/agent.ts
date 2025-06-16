export type SizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB';
export type BandwidthUnit = 'bps' | 'Kbps' | 'Mbps' | 'Gbps' | 'Tbps';

// Convert file size to bits
export function sizeToBits(size: number, unit: SizeUnit): number {
  const factors: Record<SizeUnit, number> = {
    B: 1,
    KB: 1e3,
    MB: 1e6,
    GB: 1e9,
    TB: 1e12,
  };
  return size * factors[unit] * 8;
}

// Convert bandwidth to bits per second
export function bandwidthToBps(value: number, unit: BandwidthUnit): number {
  const factors: Record<BandwidthUnit, number> = {
    bps: 1,
    Kbps: 1e3,
    Mbps: 1e6,
    Gbps: 1e9,
    Tbps: 1e12,
  };
  return value * factors[unit];
}

// Convert seconds to a human readable string
export function secondsToHuman(sec: number): string {
  let remaining = Math.max(0, Math.floor(sec));
  const days = Math.floor(remaining / 86400);
  remaining -= days * 86400;
  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  const minutes = Math.floor(remaining / 60);
  remaining -= minutes * 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (remaining || parts.length === 0)
    parts.push(`${remaining} second${remaining !== 1 ? 's' : ''}`);
  return parts.join(' ');
}

export interface TransferResult {
  timeSeconds: number;
  timeHuman: string;
}

export function calculate_transfer_time(
  size: number,
  sizeUnit: SizeUnit,
  bandwidth: number,
  bandwidthUnit: BandwidthUnit
): TransferResult {
  const bits = sizeToBits(size, sizeUnit);
  const bps = bandwidthToBps(bandwidth, bandwidthUnit);
  const timeSeconds = bits / bps;
  const timeHuman = secondsToHuman(timeSeconds);
  return { timeSeconds, timeHuman };
}
