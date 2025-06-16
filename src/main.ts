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
  const protocolSelect = document.getElementById('protocol-select') as HTMLSelectElement;
  const ipVersionSelect = document.getElementById('ip-version-select') as HTMLSelectElement;
  const latencyInput = document.getElementById('latency-input') as HTMLInputElement;
  const latencySection = document.getElementById('latency-section') as HTMLDivElement;
  // Protocol and IP version selections are used for TCP handshake math
  // and to set a default overhead when no preset is chosen. Changing
  // either will clear any selected preset so the automatic value updates.
  const overheadInput = document.getElementById('overhead-input') as HTMLInputElement;
  const lossInput = document.getElementById('loss-input') as HTMLInputElement;
  const rwndInput = document.getElementById('rwnd-input') as HTMLInputElement;
  const presetSelect = document.getElementById('preset-select') as HTMLSelectElement;
  const headerStackDiv = document.getElementById('header-stack') as HTMLDivElement;
  const calcBtn = document.getElementById('calculate-btn') as HTMLButtonElement;
  const resultDiv = document.getElementById('result') as HTMLDivElement;
  const themeToggleBtn = document.getElementById('theme-toggle-btn') as HTMLButtonElement;

  interface HeaderLayer {
    name: string;
    bytes: number;
  }

  interface OverheadPreset {
    name: string;
    overhead: number;
    stack?: HeaderLayer[];
  }

  const PRESETS: OverheadPreset[] = [
    {
      name: 'Ethernet IPv4/TCP (≈3%)',
      overhead: 3,
      stack: [
        { name: 'Ethernet', bytes: 14 },
        { name: 'IPv4', bytes: 20 },
        { name: 'TCP', bytes: 20 },
      ],
    },
    {
      name: 'Ethernet IPv6/TCP (≈4%)',
      overhead: 4,
      stack: [
        { name: 'Ethernet', bytes: 14 },
        { name: 'IPv6', bytes: 40 },
        { name: 'TCP', bytes: 20 },
      ],
    },
    {
      name: 'Ethernet IPv4/UDP (≈2%)',
      overhead: 2,
      stack: [
        { name: 'Ethernet', bytes: 14 },
        { name: 'IPv4', bytes: 20 },
        { name: 'UDP', bytes: 8 },
      ],
    },
    {
      name: 'Ethernet IPv6/UDP (≈3%)',
      overhead: 3,
      stack: [
        { name: 'Ethernet', bytes: 14 },
        { name: 'IPv6', bytes: 40 },
        { name: 'UDP', bytes: 8 },
      ],
    },
    {
      name: 'MPLS VPN (≈5%)',
      overhead: 5,
      stack: [
        { name: 'Ethernet', bytes: 14 },
        { name: 'MPLS x2', bytes: 8 },
        { name: 'IPv4', bytes: 20 },
        { name: 'TCP', bytes: 20 },
      ],
    },
    {
      name: 'IPsec tunnel (≈12%)',
      overhead: 12,
      stack: [
        { name: 'Ethernet', bytes: 14 },
        { name: 'IPv4', bytes: 20 },
        { name: 'IPsec', bytes: 50 },
        { name: 'TCP', bytes: 20 },
      ],
    },
    {
      name: 'L2TP/PPP with IPsec (≈20%)',
      overhead: 20,
      stack: [
        { name: 'Ethernet', bytes: 14 },
        { name: 'PPP', bytes: 8 },
        { name: 'L2TP', bytes: 4 },
        { name: 'IPsec', bytes: 50 },
        { name: 'IPv4', bytes: 20 },
        { name: 'TCP', bytes: 20 },
      ],
    },
  ];

  function refreshPresetSelect(): void {
    presetSelect.innerHTML = '<option value="">Custom...</option>';
    PRESETS.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = p.name;
      presetSelect.appendChild(opt);
    });
  }

  function renderHeaderStack(stack: HeaderLayer[] | undefined): void {
    headerStackDiv.innerHTML = '';
    if (!stack) return;
    stack.forEach((layer) => {
      const div = document.createElement('div');
      div.className = 'header-layer';
      div.textContent = `${layer.name} (${layer.bytes}B)`;
      headerStackDiv.appendChild(div);
    });
  }

  presetSelect.addEventListener('change', () => {
    const index = parseInt(presetSelect.value, 10);
    if (!isNaN(index) && PRESETS[index]) {
      const p = PRESETS[index];
      overheadInput.value = String(p.overhead);
      renderHeaderStack(p.stack);
    } else {
      renderHeaderStack(undefined);
      updateDefaultOverhead();
    }
  });

  function updateDefaultOverhead(): void {
    if (presetSelect.value !== '') return;
    const isIPv6 = ipVersionSelect.value === 'IPv6';
    const isTCP = protocolSelect.value === 'TCP';
    const presetName = `Ethernet ${isIPv6 ? 'IPv6' : 'IPv4'}/${isTCP ? 'TCP' : 'UDP'}`;
    const preset = PRESETS.find((p) => p.name.startsWith(presetName));
    if (preset) {
      overheadInput.value = String(preset.overhead);
      renderHeaderStack(preset.stack);
    } else {
      renderHeaderStack(undefined);
    }
  }

  function toggleLatencySection(): void {
    const isTCP = protocolSelect.value === 'TCP';
    latencySection.style.display = isTCP ? 'block' : 'none';
  }

  protocolSelect.addEventListener('change', () => {
    presetSelect.value = '';
    toggleLatencySection();
    updateDefaultOverhead();
  });
  ipVersionSelect.addEventListener('change', () => {
    presetSelect.value = '';
    updateDefaultOverhead();
  });

  function showError(msg: string): void {
    resultDiv.innerHTML = `<div class="result-item"><h3>Error:</h3><p>${msg}</p></div>`;
  }

  calcBtn.addEventListener('click', () => {
    const sizeVal = parseFloat(sizeInput.value);
    const bwVal = parseFloat(bwInput.value);
    const protocol = protocolSelect.value;
    const latencyVal = parseFloat(latencyInput.value) || 0;
    const overheadVal = parseFloat(overheadInput.value) || 0;
    const lossVal = parseFloat(lossInput.value) || 0;
    const rwndVal = parseFloat(rwndInput.value) || 0;
    if (isNaN(sizeVal) || sizeVal <= 0) {
      showError('Please enter a valid file size');
      return;
    }
    if (isNaN(bwVal) || bwVal <= 0) {
      showError('Please enter a valid bandwidth');
      return;
    }
    const bits = bytesToBits(sizeVal, sizeUnit.value);
    const rawBps = bandwidthToBps(bwVal, bwUnit.value);
    const dataSecRaw = bits / rawBps;
    const bpsWithOverhead = rawBps * (1 - overheadVal / 100);
    const dataSecOverhead = bits / bpsWithOverhead;
    const rttSec = latencyVal / 1000;
    const handshakeSec = protocol === 'TCP' ? rttSec * 2 : 0;
    const bdpBits = rawBps * rttSec;
    const bdpBytes = bdpBits / 8;
    const lossRate = lossVal / 100;
    const MSS_BYTES = 1460;
    const lossBps = lossRate > 0 ? 1.22 * (MSS_BYTES * 8) / (rttSec * Math.sqrt(lossRate)) : Infinity;
    const rwndBps = rwndVal > 0 && rttSec > 0 ? (rwndVal * 8) / rttSec : Infinity;
    const maxOverheadBps = bpsWithOverhead;
    const expectedBps = Math.min(rawBps, maxOverheadBps, lossBps, rwndBps);
    const timeSecRaw = handshakeSec + dataSecRaw;
    const timeSecOverhead = handshakeSec + dataSecOverhead;
    const timeSecExpected = bits / expectedBps;

    const timeStrRaw = secondsToTime(timeSecRaw);
    const timeStrOverhead = secondsToTime(timeSecOverhead);
    const timeStrExpected = secondsToTime(timeSecExpected);

    const baseRaw = `(${sizeVal}${sizeUnit.value} × 8b/B) ÷ (${bwVal}${bwUnit.value})`;
    const overheadFactor = 1 - overheadVal / 100;
    const baseOverhead = `(${sizeVal}${sizeUnit.value} × 8b/B) ÷ (${bwVal}${bwUnit.value} × (1 - ${overheadVal}/100 = ${overheadFactor.toFixed(2)}))`;
    const handshakeFormula = protocol === 'TCP'
      ? `(2 × ${latencyVal}ms / 1000 = ${handshakeSec.toFixed(2)}s) + `
      : '';
    const formulaRaw = `Formula: ${handshakeFormula}${baseRaw} = ${timeSecRaw.toFixed(2)} seconds`;
    const formulaOverhead = `Formula: ${handshakeFormula}${baseOverhead} = ${timeSecOverhead.toFixed(2)} seconds`;
    const formulaOverheadBps = `Formula: ${bwVal}${bwUnit.value} × (1 - ${overheadVal}/100 = ${overheadFactor.toFixed(2)})`;
    const formulaLossBps = lossRate > 0
      ? `Formula: 1.22 × 1460 × 8 ÷ (${latencyVal}ms / 1000 × sqrt(${lossRate.toFixed(5)}))`
      : 'Formula: Unlimited (no loss)';
    const formulaRwndBps = rwndVal > 0 && rttSec > 0
      ? `Formula: ${rwndVal} × 8 ÷ ${rttSec.toFixed(3)}s`
      : 'Formula: Unlimited';
    const formulaExpectedBps = `Formula: min(${rawBps.toFixed(0)}, ${maxOverheadBps.toFixed(0)}, ${lossBps === Infinity ? '∞' : lossBps.toFixed(0)}, ${rwndBps === Infinity ? '∞' : rwndBps.toFixed(0)}) = ${expectedBps.toFixed(0)}`;
    const formulaMinTime = `Formula: ${bits} ÷ ${expectedBps.toFixed(0)}`;

    function fmtMbps(bps: number): string {
      return bps === Infinity ? 'Unlimited' : (bps / 1e6).toFixed(3) + ' Mbps';
    }

    const helpIcon = (desc: string) => `<span class="help-icon" title="${desc}">?</span>`;

    resultDiv.innerHTML = `
      <div class="result-item primary-result">
        <h3>Minimum Transfer Time: ${helpIcon('File size divided by expected maximum throughput.')}</h3>
        <p>${timeStrExpected}</p>
        <p class="formula">${formulaMinTime} = ${timeSecExpected.toFixed(2)} seconds</p>
      </div>
      <div class="result-item">
        <h3>Transfer Time Without Overhead: ${helpIcon('Simple transfer time without protocol overhead or handshake.')}</h3>
        <p>${timeStrRaw}</p>
        <p class="formula">${formulaRaw}</p>
      </div>
      <div class="result-item">
        <h3>Transfer Time With Overhead: ${helpIcon('Transfer time including protocol overhead and handshake delay.')}</h3>
        <p>${timeStrOverhead}</p>
        <p class="formula">${formulaOverhead}</p>
      </div>
      <div class="result-item">
        <h3>Bandwidth-Delay Product: ${helpIcon('Bandwidth-Delay Product (BDP) = bandwidth × latency.')}</h3>
        <p>${bdpBits.toLocaleString()} bits (${bdpBytes.toLocaleString()} bytes)</p>
        <p class="formula">Formula: ${bwVal}${bwUnit.value} × ${latencyVal}ms / 1000 = ${bdpBits.toFixed(0)} bits</p>
      </div>
      <div class="result-item">
        <h3>Minimum TCP Window Size: ${helpIcon('Minimum TCP Receive Window (BDP / 8).')}</h3>
        <p>${bdpBytes.toLocaleString()} bytes</p>
        <p class="formula">Formula: ${bdpBits.toFixed(0)} bits ÷ 8 = ${bdpBytes.toFixed(0)} bytes</p>
      </div>
      <div class="result-item">
        <h3>Max TCP Throughput with Overhead: ${helpIcon('Effective Bandwidth after subtracting protocol overhead.')}</h3>
        <p>${fmtMbps(maxOverheadBps)}</p>
        <p class="formula">${formulaOverheadBps}</p>
      </div>
      <div class="result-item">
        <h3>Max TCP Throughput Limited by Packet Loss: ${helpIcon('Mathis et al. loss-based throughput formula.')}</h3>
        <p>${fmtMbps(lossBps)}</p>
        <p class="formula">${formulaLossBps}</p>
      </div>
      <div class="result-item">
        <h3>Max TCP Throughput Limited by TCP Window: ${helpIcon('Throughput limited by TCP receive window (rwnd / RTT).')}</h3>
        <p>${fmtMbps(rwndBps)}</p>
        <p class="formula">${formulaRwndBps}</p>
      </div>
      <div class="result-item">
        <h3>Expected Maximum TCP Throughput: ${helpIcon('Minimum of bandwidth, overhead, loss (Mathis) and window limits.')}</h3>
        <p>${fmtMbps(expectedBps)}</p>
        <p class="formula">${formulaExpectedBps}</p>
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
  renderHeaderStack(undefined);
  toggleLatencySection();
  updateDefaultOverhead();
});
