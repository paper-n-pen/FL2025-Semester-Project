import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import Whiteboard from "../Whiteboard";
import { getActiveAuthState, getAuthStateForType, markActiveUserType } from "../utils/authStorage";
import { getSocket, SOCKET_ENDPOINT } from "../socket";
import type { SessionSocket } from "../socket";
import type { SupportedUserType } from "../utils/authStorage";

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

export default function SessionRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const sessionSocket = useMemo<SessionSocket>(() => getSocket(), []);

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
    const activeSocket = sessionSocket;

    const ensureUserState = (candidate: AuthenticatedUser) => {
      setUser((previous: AuthenticatedUser | null) => {
        if (previous && previous.id === candidate.id && previous.username === candidate.username && previous.userType === candidate.userType) {
          return previous;
        }
        return candidate;
      });
    };

    const resolveSupportedUserType = (value?: string | null): SupportedUserType | null => {
      return value === "student" || value === "tutor" ? value : null;
    };

    const resolveUser = () => {
      const activeState = getActiveAuthState();
      if (activeState.user && activeState.userType) {
        const resolvedUser: AuthenticatedUser = {
          ...activeState.user,
          userType: activeState.user.userType ?? activeState.userType,
        };
        const supportedType = resolveSupportedUserType(resolvedUser.userType ?? activeState.userType);
        if (supportedType) {
          markActiveUserType(supportedType);
          ensureUserState({ ...resolvedUser, userType: supportedType });
          return true;
        }
        ensureUserState(resolvedUser);
        return true;
      }

      const studentState = getAuthStateForType("student");
      if (studentState.user) {
        const resolvedUser: AuthenticatedUser = {
          ...studentState.user,
          userType: studentState.user.userType ?? "student",
        };
        markActiveUserType("student");
        ensureUserState(resolvedUser);
        return true;
      }

      const tutorState = getAuthStateForType("tutor");
      if (tutorState.user) {
        const resolvedUser: AuthenticatedUser = {
          ...tutorState.user,
          userType: tutorState.user.userType ?? "tutor",
        };
        markActiveUserType("tutor");
        ensureUserState(resolvedUser);
        return true;
      }

      return false;
    };

    if (!resolveUser()) {
      navigate("/");
      return () => undefined;
    }

    const handleConnect = () => {
      if (sessionId) {
        activeSocket.emit("join-session", sessionId);
      }
    };

    if (activeSocket.connected) {
      handleConnect();
    }

    activeSocket.on("connect", handleConnect);

    const handleIncomingMessage = (message: Message) => {
      setMessages((previousMessages: Message[]) => [...previousMessages, message]);
    };

    const handleSessionEnded = (payload: { sessionId: string; endedBy: string }) => {
      if (payload?.sessionId?.toString() === sessionId?.toString()) {
        window.alert("Session has ended. Returning to dashboard.");
        redirectAfterSession();
      }
    };

    const messageListener = (...args: unknown[]) => {
      const [incoming] = args as [Message | undefined];
      if (!incoming) {
        return;
      }
      handleIncomingMessage(incoming);
    };

    const sessionEndedListener = (...args: unknown[]) => {
      const [incoming] = args as [{ sessionId: string; endedBy: string } | undefined];
      if (!incoming) {
        return;
      }
      handleSessionEnded(incoming);
    };

    activeSocket.on("session-message", messageListener);
    activeSocket.on("session-ended", sessionEndedListener);

    return () => {
      if (sessionId) {
        activeSocket.emit("leave-session", sessionId);
      }
      activeSocket.off("connect", handleConnect);
      activeSocket.off("session-message", messageListener);
      activeSocket.off("session-ended", sessionEndedListener);
    };
  }, [sessionId, navigate, redirectAfterSession, sessionSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !user || !sessionId) {
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: user.username,
      timestamp: new Date().toISOString(),
    };

    setMessages((previousMessages: Message[]) => [...previousMessages, message]);
    setNewMessage("");

    sessionSocket.emit("session-message", {
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
            <Whiteboard socket={sessionSocket} sessionId={sessionId} />
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
            {messages.map((message: Message) => {
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
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewMessage(event.target.value)}
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
