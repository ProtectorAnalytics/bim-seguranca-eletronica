import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { APP_VERSION } from '../data/constants';

/**
 * Health check component rendered at /?health=1 (or usable in admin panel).
 * Checks: app status, Supabase connectivity, version info.
 */
export default function HealthCheck() {
  const [status, setStatus] = useState({ app: 'checking', supabase: 'checking' });
  const version = `${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.build}`;

  useEffect(() => {
    const check = async () => {
      const result = { app: 'ok', supabase: 'checking' };
      try {
        const start = Date.now();
        const { error } = await supabase.from('plans').select('id').limit(1);
        const latency = Date.now() - start;
        result.supabase = error ? 'error' : 'ok';
        result.supabaseLatency = latency;
        result.supabaseError = error?.message;
      } catch (e) {
        result.supabase = 'error';
        result.supabaseError = e.message;
      }
      result.overall = result.supabase === 'ok' ? 'ok' : 'degraded';
      setStatus(result);
    };
    check();
  }, []);

  const data = {
    status: status.overall || 'checking',
    timestamp: new Date().toISOString(),
    version,
    date: APP_VERSION.date,
    checks: {
      app: status.app,
      supabase: status.supabase,
      supabase_latency_ms: status.supabaseLatency,
      supabase_error: status.supabaseError,
    },
  };

  return (
    <pre style={{
      fontFamily: 'monospace', fontSize: 13, padding: 24,
      background: '#f8fafc', color: '#1e293b', margin: 0, minHeight: '100vh',
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
