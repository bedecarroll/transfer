function bytesToBits(size: number, unit: string): number {
  const unitFactors: Record<string, number> = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };
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
  const calcBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resultDiv = document.getElementById('result') as HTMLDivElement;
  const themeToggleBtn = document.getElementById('theme-toggle-btn') as HTMLButtonElement;

  function showError(msg: string): void {
    resultDiv.innerHTML = `<div class="result-item"><h3>Error:</h3><p>${msg}</p></div>`;
  }

  calcBtn.addEventListener('click', () => {
    const sizeVal = parseFloat(sizeInput.value);
    const bwVal = parseFloat(bwInput.value);
    if (isNaN(sizeVal) || sizeVal <= 0) {
      showError('Please enter a valid file size');
      return;
    }
    if (isNaN(bwVal) || bwVal <= 0) {
      showError('Please enter a valid bandwidth');
      return;
    }
    const bits = bytesToBits(sizeVal, sizeUnit.value);
    const bps = bandwidthToBps(bwVal, bwUnit.value);
    const timeSec = bits / bps;
    const timeStr = secondsToTime(timeSec);
    const formula = `Formula: (${sizeVal}${sizeUnit.value} × 8) ÷ (${bwVal}${bwUnit.value}) = ${timeSec.toFixed(2)} seconds`;
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
});
