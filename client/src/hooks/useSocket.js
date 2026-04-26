import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [voteUpdates, setVoteUpdates] = useState([]);
  const [blockedVoters, setBlockedVoters] = useState([]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected:', socket.id);
      socket.emit('join:admin');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('fraud:detected', (data) => {
      setFraudAlerts(prev => [{ ...data, id: Date.now() }, ...prev.slice(0, 49)]);
    });

    socket.on('vote:cast', (data) => {
      setVoteUpdates(prev => [{ ...data, id: Date.now() }, ...prev.slice(0, 9)]);
    });

    socket.on('voter:blocked', (data) => {
      setBlockedVoters(prev => [{ ...data, id: Date.now() }, ...prev.slice(0, 9)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearAlerts = () => setFraudAlerts([]);

  return { socket: socketRef.current, connected, fraudAlerts, voteUpdates, blockedVoters, clearAlerts };
}
