import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

window.scrollTo = vi.fn();

globalThis.ResizeObserver = class ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
};
