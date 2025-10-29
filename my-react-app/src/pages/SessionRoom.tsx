import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import DrawIcon from "@mui/icons-material/Draw";
import axios from "axios";
import io, { Socket } from "socket.io-client";

import Whiteboard from "../Whiteboard";
import { getActiveAuthState, getAuthStateForType, markActiveUserType } from "../utils/authStorage";

interface AuthenticatedUser {
  id: number;
  username: string;
  userType?: string;
}

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string | Date;
}

const SOCKET_ENDPOINT = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

export default function SessionRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const redirectAfterSession = useCallback(() => {
    if (user?.userType === "tutor") {
      navigate("/tutor/dashboard");
      return;
    }

    if (user?.userType === "student") {
      navigate("/student/dashboard");
      return;
    }

    const activeState = getActiveAuthState();
    if (activeState.userType === "tutor") {
      navigate("/tutor/dashboard");
      return;
    }

    if (activeState.userType === "student") {
      navigate("/student/dashboard");
      return;
    }

    const studentState = getAuthStateForType("student");
    if (studentState.user) {
      navigate("/student/dashboard");
      return;
    }

    const tutorState = getAuthStateForType("tutor");
    if (tutorState.user) {
      navigate("/tutor/dashboard");
      return;
    }

    navigate("/");
  }, [navigate, user]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_ENDPOINT, { withCredentials: true });
    }

    const socket = socketRef.current;

    const resolveUser = () => {
      const activeState = getActiveAuthState();
      if (activeState.user && activeState.userType) {
        markActiveUserType(activeState.userType);
        setUser({ ...activeState.user, userType: activeState.user.userType ?? activeState.userType });
        return true;
      }

      const studentState = getAuthStateForType("student");
      if (studentState.user) {
        markActiveUserType("student");
        setUser({ ...studentState.user, userType: studentState.user.userType ?? "student" });
        return true;
      }

      const tutorState = getAuthStateForType("tutor");
      if (tutorState.user) {
        markActiveUserType("tutor");
        setUser({ ...tutorState.user, userType: tutorState.user.userType ?? "tutor" });
        return true;
      }

      return false;
    };

    if (!resolveUser()) {
      navigate("/");
      return () => undefined;
    }

    if (sessionId) {
      socket.emit("join-session", sessionId);
    }

    const handleIncomingMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleSessionEnded = (payload: { sessionId: string; endedBy: string }) => {
      if (payload?.sessionId?.toString() === sessionId?.toString()) {
        window.alert("Session has ended. Returning to dashboard.");
        redirectAfterSession();
      }
    };

    socket.on("session-message", handleIncomingMessage);
    socket.on("session-ended", handleSessionEnded);

    return () => {
      if (sessionId) {
        socket.emit("leave-session", sessionId);
      }
      socket.off("session-message", handleIncomingMessage);
      socket.off("session-ended", handleSessionEnded);
    };
  }, [sessionId, navigate, redirectAfterSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !user) {
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: user.username,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    socketRef.current?.emit("session-message", {
      sessionId,
      message,
    });
  };

  const handleEndSession = async () => {
    if (!sessionId || !user) {
      return;
    }

    if (!window.confirm("Are you sure you want to end this session?")) {
      return;
    }

    try {
      const sessionIdNumber = Number(sessionId);
      if (!Number.isInteger(sessionIdNumber)) {
        window.alert("Invalid session identifier.");
        return;
      }

      await axios.post(`${SOCKET_ENDPOINT}/api/queries/session/end`, {
        sessionId: sessionIdNumber,
        endedBy: user.id,
      });

      redirectAfterSession();
    } catch (error) {
      console.error("Error ending session:", error);
      window.alert("Failed to end session. Please try again.");
    }
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
          <Button variant="contained" color="error" onClick={handleEndSession} sx={{ fontWeight: 600 }}>
            End Session
          </Button>
        </Container>
      </Box>

      <Container
        maxWidth="lg"
        sx={{ flex: 1, py: 4, display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}
      >
        <Paper elevation={5} sx={{ p: 3, borderRadius: 4, display: "flex", flexDirection: "column" }}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <DrawIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              Whiteboard
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Box flex={1} minHeight={400}>
            <Whiteboard socket={socketRef.current} sessionId={sessionId} />
          </Box>
        </Paper>

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
            {messages.map((message) => {
              const isOwnMessage = message.sender === user?.username;
              const timestamp = new Date(message.timestamp);
              const formattedTime = Number.isNaN(timestamp.getTime())
                ? ""
                : timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <Box key={message.id} display="flex" justifyContent={isOwnMessage ? "flex-end" : "flex-start"} mb={1}>
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isOwnMessage ? "primary.main" : "grey.200",
                      color: isOwnMessage ? "common.white" : "text.primary",
                      maxWidth: "80%",
                    }}
                  >
                    <Typography variant="body2">{message.text}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {message.sender}
                      {formattedTime ? ` • ${formattedTime}` : ""}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>

          <Box component="form" onSubmit={sendMessage} display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
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
