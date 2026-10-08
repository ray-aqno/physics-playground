// @vitest-environment happy-dom
import { render } from 'preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimShell } from '../../src/sims/SimShell';

function mount(onToggle = vi.fn(), onReset = vi.fn(), onKey = vi.fn()): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  render(
    <SimShell label="Test sim" running={false} onToggle={onToggle} onReset={onReset} onKey={onKey}
      readout={[{ label: 'Total momentum', value: '2.00 kg·m/s' }]} description="Cart 1, 2.0 kg, at rest." message="Sim reset." noCanvas={false} help="Space: play">
      <canvas />
    </SimShell>,
    root,
  );
  return root;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('SimShell (council condition 5)', () => {
  it('shows a numeric readout with labels', () => {
    const root = mount();
    expect(root.querySelector('dt')?.textContent).toBe('Total momentum');
    expect(root.querySelector('dd')?.textContent).toBe('2.00 kg·m/s');
  });
  it('has a polite live text description for screen readers', () => {
    const cap = mount().querySelector('figcaption');
    expect(cap?.getAttribute('aria-live')).toBe('polite');
    expect(cap?.textContent).toBe('Cart 1, 2.0 kg, at rest.');
  });
  it('announces reset messages as a status', () => {
    expect(mount().querySelector('[role="status"]')?.textContent).toBe('Sim reset.');
  });
  it('Space toggles, R resets, other keys go to the sim', () => {
    const toggle = vi.fn();
    const reset = vi.fn();
    const key = vi.fn();
    const stage = mount(toggle, reset, key).querySelector('.sim-stage');
    stage?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    stage?.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    stage?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(key).toHaveBeenCalledTimes(1);
  });
  it('the sim stage is keyboard focusable', () => {
    expect(mount().querySelector('.sim-stage')?.getAttribute('tabindex')).toBe('0');
  });
});
