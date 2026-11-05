(() => {
  'use strict';
  const lab = document.querySelector('#inside-the-lab');
  if (!lab) return;
  const tabs = Array.from(lab.querySelectorAll('[data-lab-tab]'));
  const panels = Array.from(lab.querySelectorAll('[data-lab-panel]'));
  function activate(tab, focus) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => {panel.hidden = panel.id !== tab.getAttribute('aria-controls');});
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab, false));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); activate(tabs[next], true);
    });
  });
  const quantum = lab.querySelector('#lab-quantum');
  quantum.querySelectorAll('[data-transition]').forEach(button => {
    button.addEventListener('click', () => {
      const transition = button.dataset.transition;
      quantum.dataset.transition = transition;
      quantum.querySelectorAll('[data-transition]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      quantum.querySelector('[data-transition-arrow]').setAttribute('d', transition === '01' ? 'M350 272 V196 M342 204 L350 196 L358 204' : 'M350 172 V111 M342 119 L350 111 L358 119');
      quantum.querySelector('[data-transition-readout]').textContent = transition === '01' ? '|0⟩ ↔ |1⟩' : '|1⟩ ↔ |2⟩';
    });
  });
  const phase = lab.querySelector('#lab-phase');
  function wave(offset, center) {
    const points = [];
    for (let i = 0; i <= 360; i++) {
      points.push((75 + i * 1.4).toFixed(2) + ',' + (center - 43 * Math.cos(i / 360 * 4 * Math.PI + offset)).toFixed(2));
    }
    return points.join(' ');
  }
  lab.querySelector('[data-wave-i]').setAttribute('points', wave(0, 112));
  function updatePhase() {
    const value = Number(phase.value);
    lab.querySelector('[data-wave-q]').setAttribute('points', wave(value * Math.PI / 180, 247));
    lab.querySelector('#phase-value').textContent = value + '°';
    lab.querySelector('[data-phase-readout]').textContent = 'Δφ = ' + value + '°';
  }
  phase.addEventListener('input', updatePhase); updatePhase();
  const logic = lab.querySelector('#lab-logic');
  const bits = {a: 1, b: 0};
  function updateLogic() {
    const output = bits.a & bits.b;
    for (const name of ['a', 'b']) {
      const button = logic.querySelector('[data-bit="' + name + '"]');
      button.setAttribute('aria-pressed', String(Boolean(bits[name])));
      button.querySelector('b').textContent = bits[name];
    }
    for (const name of ['a', 'b', 'y']) {
      const value = name === 'y' ? output : bits[name];
      const group = logic.querySelector('[data-logic-node="' + name + '"]');
      group.classList.toggle('logic-on', Boolean(value));
      group.querySelector('.logic-value').textContent = value;
    }
    logic.querySelector('#logic-result').textContent = bits.a + ' ∧ ' + bits.b + ' = ' + output;
    logic.querySelectorAll('[data-truth]').forEach(row => {row.dataset.current = String(row.dataset.truth === String(bits.a) + bits.b);});
  }
  logic.querySelectorAll('[data-bit]').forEach(button => button.addEventListener('click', () => {bits[button.dataset.bit] ^= 1; updateLogic();}));
  updateLogic();
  const device = lab.querySelector('#lab-device');
  const gate = device.querySelector('[data-gate-toggle]');
  gate.addEventListener('click', () => {
    const on = gate.getAttribute('aria-checked') !== 'true';
    gate.setAttribute('aria-checked', String(on));
    device.dataset.gate = on ? 'on' : 'off';
    gate.querySelector('[data-gate-label]').textContent = on ? 'Above threshold' : 'Below threshold';
    device.querySelector('[data-gate-readout]').textContent = on ? 'VGS > VT' : 'VGS < VT';
    device.querySelector('[data-channel-description]').textContent = on ? 'Above threshold, an electron channel forms beneath the gate, connecting source and drain.' : 'Below threshold, there is no strong inversion channel beneath the gate.';
  });
})();
