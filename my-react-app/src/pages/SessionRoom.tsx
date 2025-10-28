// my-react-app/src/pages/SessionRoom.tsx

// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import Whiteboard from '../Whiteboard';
// import io from 'socket.io-client';

// const socket = io("http://localhost:3000");

// interface Message {
//   id: string;
//   text: string;
//   sender: string;
//   timestamp: Date;
// }

// const SessionRoom = () => {
//   const { sessionId } = useParams();
//   const navigate = useNavigate();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [user, setUser] = useState<any>(null);

//   useEffect(() => {
//     const userData = JSON.parse(localStorage.getItem('user') || '{}');
//     if (!userData.id) {
//       navigate('/');
//       return;
//     }
//     setUser(userData);

//     // Join session room
//     socket.emit('join-session', sessionId);

//     // Listen for messages
//     socket.on('session-message', (message) => {
//       setMessages(prev => [...prev, message]);
//     });

//     return () => {
//       socket.off('session-message');
//     };
//   }, [sessionId, navigate]);

//   const sendMessage = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!newMessage.trim() || !user) return;

//     const message = {
//       id: Date.now().toString(),
//       text: newMessage.trim(),
//       sender: user.username,
//       timestamp: new Date()
//     };

//     socket.emit('session-message', {
//       sessionId,
//       message
//     });

//     setMessages(prev => [...prev, message]);
//     setNewMessage('');
//   };

//   const handleEndSession = () => {
//     if (confirm('Are you sure you want to end this session?')) {
//       navigate('/student/dashboard');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center space-x-3">
//               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
//                 <span className="text-white font-bold text-sm">MT</span>
//               </div>
//               <span className="text-xl font-semibold text-gray-900">Session Room</span>
//             </div>
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={handleEndSession}
//                 className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
//               >
//                 End Session
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="flex h-[calc(100vh-64px)]">
//         {/* Whiteboard */}
//         <div className="flex-1">
//           <Whiteboard />
//         </div>

//         {/* Chat Panel */}
//         <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
//           <div className="px-4 py-3 border-b border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
//           </div>

//           {/* Messages */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-3">
//             {messages.map((message) => (
//               <div
//                 key={message.id}
//                 className={`flex ${message.sender === user?.username ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`max-w-xs px-3 py-2 rounded-lg ${
//                     message.sender === user?.username
//                       ? 'bg-blue-600 text-white'
//                       : 'bg-gray-200 text-gray-900'
//                   }`}
//                 >
//                   <p className="text-sm">{message.text}</p>
//                   <p className="text-xs opacity-70 mt-1">
//                     {message.sender} • {new Date(message.timestamp).toLocaleTimeString()}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Message Input */}
//           <div className="border-t border-gray-200 p-4">
//             <form onSubmit={sendMessage} className="flex space-x-2">
//               <input
//                 type="text"
//                 value={newMessage}
//                 onChange={(e) => setNewMessage(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//               />
//               <button
//                 type="submit"
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
//               >
//                 Send
//               </button>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SessionRoom;

// src/pages/SessionRoom.tsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Avatar,
  Grid,
  Divider,
  TextField,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DrawIcon from "@mui/icons-material/Draw";
import Whiteboard from "../Whiteboard";
import io from "socket.io-client";

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
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.emit("join-session", sessionId);
    socket.on("session-message", (m: Message) => setMessages((p) => [...p, m]));
    return () => {
      socket.off("session-message");
    };
  }, [sessionId, navigate]);
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    const msg: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: user.username,
      timestamp: new Date().toISOString(),
    };
    socket.emit("session-message", { sessionId, message: msg });
    setMessages((p) => [...p, msg]);
    setNewMessage("");
  };

  const handleEndSession = () => {
    if (confirm("End session?")) navigate("/student/dashboard");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f5f7ff, #e8f0ff)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ---------- Header ---------- */}
      <Box
        sx={{
          bgcolor: "white",
          boxShadow: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: "primary.main" }}>MT</Avatar>
            <Typography variant="h6" fontWeight="bold">
              Session Room
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            onClick={handleEndSession}
            sx={{ fontWeight: 600 }}
          >
            End Session
          </Button>
        </Container>
      </Box>

      {/* ---------- Main Content ---------- */}
      <Container
        maxWidth="lg"
        sx={{ flex: 1, py: 4, display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}
      >
        {/* ---------- Whiteboard ---------- */}
        <Paper elevation={5} sx={{ p: 3, borderRadius: 4, display: "flex", flexDirection: "column" }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <DrawIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Whiteboard
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box flex={1} minHeight={400}>
            <Whiteboard />
          </Box>
        </Paper>

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
    </Box>
  );
}
