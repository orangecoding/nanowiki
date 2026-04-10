import { renderHook, act } from '@testing-library/react';
import { vi, it, expect, beforeEach } from 'vitest';
import { useWebSocket } from '../../src/hooks/useWebSocket.js';

let mockWs;

beforeEach(() => {
  mockWs = { send: vi.fn(), close: vi.fn(), readyState: 1 };
  global.WebSocket = vi.fn(() => mockWs);
});

it('calls onEvent when message arrives', () => {
  const onEvent = vi.fn();
  renderHook(() => useWebSocket(onEvent));

  act(() => {
    mockWs.onmessage({ data: JSON.stringify({ type: 'file:added', path: 'new.md' }) });
  });

  expect(onEvent).toHaveBeenCalledWith({ type: 'file:added', path: 'new.md' });
});
