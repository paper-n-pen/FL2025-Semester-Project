// my-react-app/src/pages/tutor/TutorDashboard.tsx

import _React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { getAuthStateForType, markActiveUserType, clearAuthState } from '../../utils/authStorage';

const socket = io("http://localhost:3000");

interface StudentQuery {
  id: string;
  studentId: number;
  studentName: string;
  subject: string;
  subtopic: string;
  query: string;
  timestamp: Date;
  rate: number | null;
  status?: string;
  sessionId?: string | null;
  sessionStatus?: string | null;
}

const TutorDashboard = () => {
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [acceptedQueries, setAcceptedQueries] = useState<StudentQuery[]>([]);
  const [_loading, _setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const declinedQueryIdsRef = useRef<Set<string>>(new Set());
  const [tutorUser, setTutorUser] = useState<any>(() => {
    const stored = getAuthStateForType('tutor');
    return stored.user;
  });
  const navigate = useNavigate();

  const fetchAcceptedQueries = useCallback(async () => {
    try {
      if (!tutorUser?.id) {
        setAcceptedQueries([]);
        return;
      }

      const response = await axios.get(`http://localhost:3000/api/queries/tutor/${tutorUser.id}/accepted-queries`);
      setAcceptedQueries(response.data || []);
    } catch (error) {
      console.error('Error fetching accepted queries:', error);
    }
  }, [tutorUser?.id]);

  // Check authentication
  useEffect(() => {
    const stored = getAuthStateForType('tutor');
    if (!stored.user) {
      navigate('/tutor/setup');
      return;
    }

    markActiveUserType('tutor');
    setTutorUser(stored.user);
  }, [navigate]);

  // Socket.IO for real-time notifications
  useEffect(() => {
    if (tutorUser?.id) {
      socket.emit('join-tutor-room', tutorUser.id);
    }

    const newQueryHandler = (query: any) => {
      setNotifications((prev: any[]) => [...prev, {
        id: Date.now(),
        type: 'new-query',
        message: `New query in ${query.subject}: ${query.subtopic}`,
        query
      }]);
    };

    socket.on('new-query', newQueryHandler);

    return () => {
      if (tutorUser?.id) {
        socket.emit('leave-tutor-room', tutorUser.id);
      }
      socket.off('new-query', newQueryHandler);
    };
  }, [tutorUser?.id]);

  // Fetch queries from backend
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        if (!tutorUser?.id) {
          return;
        }

        const response = await axios.get(`http://localhost:3000/api/queries/tutor/${tutorUser.id}`);
        const filtered = (response.data || []).filter((item: StudentQuery) => !declinedQueryIdsRef.current.has(item.id));
        setQueries(filtered);
      } catch (error) {
        console.error('Error fetching queries:', error);
      }
    };

    fetchQueries();
    const interval = setInterval(fetchQueries, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [tutorUser?.id]);

  useEffect(() => {
    if (!tutorUser?.id) {
      setAcceptedQueries([]);
      return;
    }

    fetchAcceptedQueries();
    const interval = setInterval(fetchAcceptedQueries, 5000);
    return () => clearInterval(interval);
  }, [tutorUser?.id, fetchAcceptedQueries]);

  useEffect(() => {
    const sessionEndedHandler = (payload: any) => {
      if (!payload) {
        return;
      }

      if (payload.tutorId && tutorUser?.id && payload.tutorId.toString() !== tutorUser.id.toString()) {
        return;
      }

      setAcceptedQueries((prev: StudentQuery[]) =>
        prev.filter((item: StudentQuery) => {
          if (payload.queryId && item.id === payload.queryId) {
            return false;
          }

          if (payload.sessionId && item.sessionId && item.sessionId === payload.sessionId) {
            return false;
          }

          return true;
        })
      );

      fetchAcceptedQueries();
    };

    socket.on('session-ended', sessionEndedHandler);

    return () => {
      socket.off('session-ended', sessionEndedHandler);
    };
  }, [fetchAcceptedQueries, tutorUser?.id]);

  const handleAcceptQuery = async (queryId: string) => {
    try {
      if (!tutorUser?.id) {
        navigate('/tutor/login');
        return;
      }

      const response = await axios.post('http://localhost:3000/api/queries/accept', {
        queryId,
        tutorId: tutorUser.id.toString()
      });

      if (response.data.message === 'Query accepted successfully') {
        declinedQueryIdsRef.current.delete(queryId);

        setQueries((prev: StudentQuery[]) => prev.filter((q) => q.id !== queryId));

        await fetchAcceptedQueries();
      }
    } catch (error: any) {
      console.error('Error accepting query:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to accept query. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeclineQuery = async (queryId: string) => {
    try {
      if (!tutorUser?.id) {
        navigate('/tutor/login');
        return;
      }

      await axios.post('http://localhost:3000/api/queries/decline', {
        queryId,
        tutorId: tutorUser.id
      });

      declinedQueryIdsRef.current.add(queryId);
      setQueries((prev: StudentQuery[]) => prev.filter((q) => q.id !== queryId));
    } catch (error: any) {
      console.error('Error declining query:', error);
      const message = error.response?.data?.message || error.message || 'Failed to decline query. Please try again.';
      alert(message);
    }
  };

  const handleStartSession = async (query: StudentQuery) => {
    try {
      const response = await axios.post('http://localhost:3000/api/queries/session', {
        queryId: query.id,
        tutorId: tutorUser.id,
        studentId: query.studentId
      });

      const sessionId = response.data.sessionId;
      if (sessionId) {
        setAcceptedQueries((prev: StudentQuery[]) =>
          prev.map((item: StudentQuery) =>
            item.id === query.id ? { ...item, sessionId } : item
          )
        );
        fetchAcceptedQueries();
        navigate(`/session/${sessionId}`);
      }
    } catch (error: any) {
      console.error('Error starting session:', error);
      const message = error.response?.data?.message || error.message || 'Failed to start session. Please try again.';
      alert(message);
    }
  };

  const handleLogout = () => {
    const tutorId = tutorUser?.id;
    if (tutorId) {
      socket.emit('leave-tutor-room', tutorId);
    }
    declinedQueryIdsRef.current.clear();
    clearAuthState('tutor');
    setTutorUser(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MT</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">MicroTutor</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/tutor/profile')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </button>
              <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-blue-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{notification.message}</p>
                    {notification.query && (
                      <p className="text-sm opacity-90 mt-1">
                        Student: {notification.query.studentName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                    className="text-white hover:text-gray-200 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tutor Dashboard</h1>
          <p className="text-gray-600">Help students with their questions</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* New Queries */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">New Student Queries</h2>
              <p className="text-sm text-gray-500">Accept queries to help students</p>
            </div>
            <div className="p-6">
              {queries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No new queries</h3>
                  <p className="text-gray-500">Students will appear here when they need help</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queries.map((query) => (
                    <div key={query.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {query.subject}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {query.subtopic}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {query.studentName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {query.query}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(query.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => handleAcceptQuery(query.id)}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineQuery(query.id)}
                          className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Accepted Queries */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Accepted Queries</h2>
              <p className="text-sm text-gray-500">Queries you've accepted</p>
            </div>
            <div className="p-6">
              {acceptedQueries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No accepted queries</h3>
                  <p className="text-gray-500">Accepted queries will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedQueries.map((query) => (
                    <div key={query.id} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {query.subject}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {query.subtopic}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepted
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {query.studentName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {query.query}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(query.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => handleStartSession(query)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Start Session
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;