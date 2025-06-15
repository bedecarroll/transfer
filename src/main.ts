function bytesToBits(size: number, unit: string): number {
  const unitFactors: Record<string, number> = {
    B: 1,
    KB: 1e3,
    MB: 1e6,
    GB: 1e9,
    TB: 1e12,
    KiB: 1024,
    MiB: 1024 ** 2,
    GiB: 1024 ** 3,
    TiB: 1024 ** 4,
  };
  return size * (unitFactors[unit] || 1) * 8;
}

function bandwidthToBps(value: number, unit: string): number {
  const factors: Record<string, number> = { bps: 1, Kbps: 1e3, Mbps: 1e6, Gbps: 1e9, Tbps: 1e12 };
  return value * (factors[unit] || 1);
}

function secondsToTime(sec: number): string {
  let remaining = Math.max(0, sec);
  const days = Math.floor(remaining / 86400);
  remaining -= days * 86400;
  const hours = Math.floor(remaining / 3600);
  remaining -= hours * 3600;
  const minutes = Math.floor(remaining / 60);
  remaining -= minutes * 60;
  const seconds = Math.floor(remaining);
  const parts: string[] = [];
  if (days) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  return parts.join(' ');
}

document.addEventListener('DOMContentLoaded', () => {
  const sizeInput = document.getElementById('size-input') as HTMLInputElement;
  const sizeUnit = document.getElementById('size-unit') as HTMLSelectElement;
  const bwInput = document.getElementById('bandwidth-input') as HTMLInputElement;
  const bwUnit = document.getElementById('bandwidth-unit') as HTMLSelectElement;
  const overheadInput = document.getElementById('overhead-input') as HTMLInputElement;
  const presetSelect = document.getElementById('preset-select') as HTMLSelectElement;
  const savePresetBtn = document.getElementById('save-preset-btn') as HTMLButtonElement;
  const calcBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resultDiv = document.getElementById('result') as HTMLDivElement;
  const themeToggleBtn = document.getElementById('theme-toggle-btn') as HTMLButtonElement;

  interface Preset {
    name: string;
    size: number;
    sizeUnit: string;
    bandwidth: number;
    bandwidthUnit: string;
    overhead: number;
  }

  function getPresets(): Preset[] {
    try {
      const raw = localStorage.getItem('presets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function savePresets(presets: Preset[]): void {
    localStorage.setItem('presets', JSON.stringify(presets));
  }

  function refreshPresetSelect(): void {
    const presets = getPresets();
    presetSelect.innerHTML = '<option value="">Custom...</option>';
    presets.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p.name;
      presetSelect.appendChild(opt);
    });
  }

  presetSelect.addEventListener('change', () => {
    const presets = getPresets();
    const index = parseInt(presetSelect.value, 10);
    if (!isNaN(index) && presets[index]) {
      const p = presets[index];
      sizeInput.value = String(p.size);
      sizeUnit.value = p.sizeUnit;
      bwInput.value = String(p.bandwidth);
      bwUnit.value = p.bandwidthUnit;
      overheadInput.value = String(p.overhead);
    }
  });

  savePresetBtn.addEventListener('click', () => {
    const name = prompt('Preset name?');
    if (!name) return;
    const presets = getPresets();
    presets.push({
      name,
      size: parseFloat(sizeInput.value) || 0,
      sizeUnit: sizeUnit.value,
      bandwidth: parseFloat(bwInput.value) || 0,
      bandwidthUnit: bwUnit.value,
      overhead: parseFloat(overheadInput.value) || 0,
    });
    savePresets(presets);
    refreshPresetSelect();
  });

  function showError(msg: string): void {
    resultDiv.innerHTML = `<div class="result-item"><h3>Error:</h3><p>${msg}</p></div>`;
  }

  calcBtn.addEventListener('click', () => {
    const sizeVal = parseFloat(sizeInput.value);
    const bwVal = parseFloat(bwInput.value);
    const overheadVal = parseFloat(overheadInput.value) || 0;
    if (isNaN(sizeVal) || sizeVal <= 0) {
      showError('Please enter a valid file size');
      return;
    }
    if (isNaN(bwVal) || bwVal <= 0) {
      showError('Please enter a valid bandwidth');
      return;
    }
    const bits = bytesToBits(sizeVal, sizeUnit.value);
    const bps = bandwidthToBps(bwVal, bwUnit.value) * (1 - overheadVal / 100);
    const timeSec = bits / bps;
    const timeStr = secondsToTime(timeSec);
    const formula = `Formula: (${sizeVal}${sizeUnit.value} × 8) ÷ (${bwVal}${bwUnit.value} × (1 - ${overheadVal}/100)) = ${timeSec.toFixed(2)} seconds`;
    resultDiv.innerHTML = `
      <div class="result-item">
        <h3>Estimated Transfer Time:</h3>
        <p>${timeStr}</p>
        <p class="formula">${formula}</p>
      </div>`;
  });

  function updateThemeIcon(isDark: boolean): void {
    themeToggleBtn.textContent = isDark ? '🌙' : '☀️';
  }

  function loadTheme(): void {
    const stored = localStorage.getItem('theme');
    const dark = stored === 'dark';
    document.body.classList.toggle('dark', dark);
    updateThemeIcon(dark);
  }

  function bindThemeToggle(): void {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeIcon(isDark);
    });
  }

  loadTheme();
  bindThemeToggle();
  refreshPresetSelect();
});
