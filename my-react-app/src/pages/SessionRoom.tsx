// my-react-app/src/pages/SessionRoom.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Whiteboard from '../Whiteboard';
import io from 'socket.io-client';
import axios from 'axios';
import { getActiveAuthState, getAuthStateForType, markActiveUserType } from '../utils/authStorage';
import { Box, Button, Container, Divider, Paper, TextField, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

const socket = io("http://localhost:3000");

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

export default function SessionRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<{ id: string; username: string; userType?: string } | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: user.username,
      timestamp: new Date().toISOString(),
    };

    socket.emit('session-message', {
      sessionId,
      message: msg
    });

    setMessages((prev: Message[]) => [...prev, msg]);
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
    <Box className="min-h-screen bg-gray-50">
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

    <Container className="flex h-[calc(100vh-64px)]">
      {/* Whiteboard */}
      <div className="flex-1">
        <Whiteboard socket={socket} sessionId={sessionId} />
      </div>

      {/* ---------- Chat Panel ---------- */}
      <Paper
        elevation={5}
        sx={{
          p: 3,
          borderRadius: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ChatBubbleOutlineIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Chat
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Box flex={1} overflow="auto" mb={2}>
          {messages.map((m) => (
            <Box
              key={m.id}
              display="flex"
              justifyContent={
                m.sender === user?.username ? "flex-end" : "flex-start"
              }
              mb={1}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  bgcolor:
                    m.sender === user?.username
                      ? "primary.main"
                      : "grey.200",
                  color:
                    m.sender === user?.username
                      ? "common.white"
                      : "text.primary",
                  maxWidth: "80%",
                }}
              >
                <Typography variant="body2">{m.text}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {m.sender} •{" "}
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box component="form" onSubmit={sendMessage} display="flex" gap={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button variant="contained" color="primary" type="submit">
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
    </Box >
  );
}
