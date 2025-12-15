import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [appState, setAppState] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Connect to the socket server
        // Use env var in production, fallback to localhost for dev
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const newSocket = io(socketUrl);

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from socket server');
            setIsConnected(false);
        });

        newSocket.on('state_update', (state) => {
            setAppState(state);
        });

        newSocket.on('bingo_update', (bingoState) => {
            setAppState(prev => prev ? { ...prev, bingo: bingoState } : null);
        });

        newSocket.on('gift_update', (giftState) => {
            setAppState(prev => prev ? { ...prev, gifts: giftState } : null);
        });

        newSocket.on('spirit_update', (spiritState) => {
            setAppState(prev => prev ? { ...prev, spiritWear: spiritState } : null);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    const login = (user) => {
        setCurrentUser(user);
        if (socket) {
            socket.emit('join_session', user);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, appState, isConnected, currentUser, login }}>
            {children}
        </SocketContext.Provider>
    );
};
