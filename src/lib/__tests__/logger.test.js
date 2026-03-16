import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
  let logger;

  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it('warn and error always log', async () => {
    // Dynamic import to get fresh module
    logger = (await import('../../lib/logger.js')).default;
    logger.warn('test warning');
    logger.error('test error');
    expect(console.warn).toHaveBeenCalledWith('[BIM]', 'test warning');
    expect(console.error).toHaveBeenCalledWith('[BIM]', 'test error');
  });

  it('exports all expected methods', async () => {
    logger = (await import('../../lib/logger.js')).default;
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});
