import { useEffect, useRef } from 'react';

export function useWebSocket(onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let ws;
    let retryDelay = 1000;
    let stopped = false;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      ws = new WebSocket(`${protocol}://${window.location.host}/ws`);

      ws.onmessage = (e) => {
        try {
          onEventRef.current(JSON.parse(e.data));
        } catch {}
      };

      ws.onclose = () => {
        if (stopped) return;
        setTimeout(connect, Math.min(retryDelay, 30000));
        retryDelay = Math.min(retryDelay * 2, 30000);
      };

      ws.onopen = () => {
        retryDelay = 1000;
      };
    }

    connect();
    return () => {
      stopped = true;
      ws?.close();
    };
  }, []);
}
