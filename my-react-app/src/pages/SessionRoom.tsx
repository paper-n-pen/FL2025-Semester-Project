// my-react-app/src/pages/SessionRoom.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Whiteboard from '../Whiteboard';
import io from 'socket.io-client';
import axios from 'axios';
import { getActiveAuthState, getAuthStateForType, markActiveUserType } from '../utils/authStorage';

const socket = io("http://localhost:3000");

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: Date;
}

const SessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const resolveUser = () => {
      const activeState = getActiveAuthState();
      if (activeState.user && activeState.userType) {
        markActiveUserType(activeState.userType);
        setUser({ ...activeState.user, userType: activeState.user.userType || activeState.userType });
        return true;
      }

      const studentState = getAuthStateForType('student');
      if (studentState.user) {
        markActiveUserType('student');
        setUser({ ...studentState.user, userType: studentState.user.userType || 'student' });
        return true;
      }

      const tutorState = getAuthStateForType('tutor');
      if (tutorState.user) {
        markActiveUserType('tutor');
        setUser({ ...tutorState.user, userType: tutorState.user.userType || 'tutor' });
        return true;
      }

      return false;
    };

    if (!resolveUser()) {
      navigate('/');
      return;
    }

    if (sessionId) {
      socket.emit('join-session', sessionId);
    }

    const messageHandler = (message: Message) => {
      setMessages((prev: Message[]) => [...prev, message]);
    };

    socket.on('session-message', messageHandler);

    return () => {
      if (sessionId) {
        socket.emit('leave-session', sessionId);
      }
      socket.off('session-message', messageHandler);
    };
  }, [sessionId, navigate]);

  const redirectAfterSession = useCallback(() => {
    if (user?.userType === 'tutor') {
      navigate('/tutor/dashboard');
      return;
    }

    if (user?.userType === 'student') {
      navigate('/student/dashboard');
      return;
    }

    const activeState = getActiveAuthState();
    if (activeState.userType === 'tutor') {
      navigate('/tutor/dashboard');
      return;
    }
    if (activeState.userType === 'student') {
      navigate('/student/dashboard');
      return;
    }

    const studentState = getAuthStateForType('student');
    if (studentState.user) {
      navigate('/student/dashboard');
      return;
    }

    const tutorState = getAuthStateForType('tutor');
    if (tutorState.user) {
      navigate('/tutor/dashboard');
      return;
    }

    navigate('/');
  }, [navigate, user]);

  useEffect(() => {
    const sessionEndedHandler = (payload: { sessionId: string; endedBy: string }) => {
      if (payload?.sessionId?.toString() === sessionId?.toString()) {
        alert('Session has ended. Returning to dashboard.');
        redirectAfterSession();
      }
    };

    socket.on('session-ended', sessionEndedHandler);

    return () => {
      socket.off('session-ended', sessionEndedHandler);
    };
  }, [sessionId, redirectAfterSession]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: user.username,
      timestamp: new Date()
    };

    socket.emit('session-message', {
      sessionId,
      message
    });

    setMessages((prev: Message[]) => [...prev, message]);
    setNewMessage('');
  };

  const handleEndSession = async () => {
    if (!sessionId || !user) {
      return;
    }

    const confirmEnd = window.confirm('Are you sure you want to end this session?');
    if (!confirmEnd) {
      return;
    }

    try {
      const sessionIdNumber = Number(sessionId);
      if (!Number.isInteger(sessionIdNumber)) {
        alert('Invalid session identifier.');
        return;
      }

      await axios.post('http://localhost:3000/api/queries/session/end', {
        sessionId: sessionIdNumber,
        endedBy: user.id
      });
      redirectAfterSession();
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MT</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Session Room</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleEndSession}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Whiteboard */}
        <div className="flex-1">
          <Whiteboard socket={socket} sessionId={sessionId} />
        </div>

        {/* Chat Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === user?.username ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.sender === user?.username
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRoom;