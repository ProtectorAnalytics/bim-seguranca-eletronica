import { describe, it, expect } from 'vitest';

// Smoke test: ensure pdf-export module loads without errors
describe('pdf-export module', () => {
  it('should import without crashing', async () => {
    const mod = await import('../pdf-export');
    expect(mod).toBeTruthy();
    expect(typeof mod.exportProjectPDF).toBe('function');
  });
});
