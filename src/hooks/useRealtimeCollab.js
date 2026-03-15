import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Real-time collaboration hook using Supabase Realtime Broadcast.
 *
 * Features:
 * - Presence: see who's online
 * - Broadcast: sync device moves, additions, deletions in real-time
 *
 * @param {string} projectId - Project ID for the channel
 * @param {object} userInfo - { id, name, color } for current user
 * @param {function} onRemoteChange - callback when a remote change arrives
 * @param {boolean} enabled - whether to enable realtime
 */
export function useRealtimeCollab(projectId, userInfo, onRemoteChange, enabled = true) {
  const channelRef = useRef(null);
  const [collaborators, setCollaborators] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const broadcastQueue = useRef([]);
  const isSelf = useRef(false);

  // Generate a unique session ID for this tab
  const sessionId = useRef(
    `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  ).current;

  useEffect(() => {
    if (!enabled || !projectId || !supabase) return;

    const channelName = `project:${projectId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // Don't receive own broadcasts
        presence: { key: sessionId },
      },
    });

    // ── Presence: track who's online ──
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = [];
      Object.entries(state).forEach(([key, presences]) => {
        presences.forEach(p => {
          if (key !== sessionId) {
            users.push({
              sessionId: key,
              id: p.user_id,
              name: p.user_name || 'Anônimo',
              color: p.color || '#046BD2',
              cursor: p.cursor || null,
            });
          }
        });
      });
      setCollaborators(users);
    });

    // ── Broadcast: receive remote changes ──
    channel.on('broadcast', { event: 'change' }, ({ payload }) => {
      if (payload?.sessionId === sessionId) return; // Skip own changes
      if (onRemoteChange) {
        isSelf.current = true;
        onRemoteChange(payload);
        isSelf.current = false;
      }
    });

    // ── Broadcast: cursor movements ──
    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload?.sessionId === sessionId) return;
      setCollaborators(prev =>
        prev.map(c =>
          c.sessionId === payload.sessionId
            ? { ...c, cursor: payload.cursor }
            : c
        )
      );
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        // Track presence
        await channel.track({
          user_id: userInfo?.id || 'guest',
          user_name: userInfo?.name || 'Visitante',
          color: userInfo?.color || getRandomColor(),
          online_at: new Date().toISOString(),
        });

        // Flush queued broadcasts
        broadcastQueue.current.forEach(msg => {
          channel.send({ type: 'broadcast', event: msg.event, payload: msg.payload });
        });
        broadcastQueue.current = [];
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
      setCollaborators([]);
    };
  }, [projectId, enabled, sessionId]);

  // ── Broadcast a change to other collaborators ──
  const broadcastChange = useCallback((type, data) => {
    if (isSelf.current) return; // Don't re-broadcast remote changes

    const payload = { sessionId, type, data, timestamp: Date.now() };
    const ch = channelRef.current;

    if (ch && isConnected) {
      ch.send({ type: 'broadcast', event: 'change', payload });
    } else {
      broadcastQueue.current.push({ event: 'change', payload });
    }
  }, [sessionId, isConnected]);

  // ── Broadcast cursor position ──
  const broadcastCursor = useCallback((x, y) => {
    const ch = channelRef.current;
    if (!ch || !isConnected) return;

    ch.send({
      type: 'broadcast',
      event: 'cursor',
      payload: { sessionId, cursor: { x, y } },
    });
  }, [sessionId, isConnected]);

  return {
    collaborators,
    isConnected,
    broadcastChange,
    broadcastCursor,
    sessionId,
  };
}

// Random color for anonymous collaborators
function getRandomColor() {
  const colors = ['#046BD2', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];
  return colors[Math.floor(Math.random() * colors.length)];
}
