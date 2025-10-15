// my-react-app/src/pages/student/StudentDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io("http://localhost:3000");

interface Subject {
  name: string;
  icon: string;
  subtopics: string[];
}

const StudentDashboard = () => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [acceptedTutors, setAcceptedTutors] = useState<any[]>([]);
  const navigate = useNavigate();

  const subjects: Subject[] = [
    {
      name: 'Computer Science',
      icon: '💻',
      subtopics: ['Java', 'Python', 'JavaScript', 'C++', 'Data Structures', 'Algorithms', 'Web Development', 'Machine Learning']
    },
    {
      name: 'Math',
      icon: '📊',
      subtopics: ['Calculus', 'Linear Algebra', 'Statistics', 'Probability', 'Discrete Math', 'Geometry']
    },
    {
      name: 'Physics',
      icon: '⚛️',
      subtopics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics', 'Optics']
    },
    {
      name: 'Chemistry',
      icon: '🧪',
      subtopics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Biochemistry']
    }
  ];

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'student') {
      navigate('/student/login');
    }
  }, [navigate]);

  // Socket.IO for real-time notifications
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    socket.emit('join-student-room', user.id);
    
    socket.on('tutor-accepted', (data) => {
      setAcceptedTutors(prev => [...prev, data]);
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'tutor-accepted',
        message: `${data.tutorName} accepted your query!`,
        data
      }]);
    });

    return () => {
      socket.off('tutor-accepted');
    };
  }, []);

  const currentSubject = subjects.find(s => s.name === selectedSubject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !selectedSubtopic || !query.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await axios.post('http://localhost:3000/api/queries/post', {
        subject: selectedSubject,
        subtopic: selectedSubtopic,
        query: query.trim(),
        studentId: user.id
      });

      if (response.data.message === 'Query posted successfully') {
        alert('Query posted successfully! Tutors will be notified.');
        setQuery('');
        setSelectedSubject('');
        setSelectedSubtopic('');
      }
    } catch (error) {
      console.error('Error posting query:', error);
      alert('Failed to post query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTutor = (tutorData: any) => {
    // Navigate to session room
    navigate(`/session/${tutorData.queryId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
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
              <div key={notification.id} className="bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{notification.message}</p>
                    {notification.data && (
                      <p className="text-sm opacity-90 mt-1">
                        Rate: ${notification.data.rate}/10min
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Post your questions and get help from expert tutors</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Post Query Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Post Your Question</h2>
              <p className="text-sm text-gray-500">Select a subject and describe what you need help with</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Subject
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {subjects.map((subject) => (
                      <button
                        key={subject.name}
                        type="button"
                        onClick={() => {
                          setSelectedSubject(subject.name);
                          setSelectedSubtopic('');
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedSubject === subject.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{subject.icon}</div>
                        <div className="font-medium text-gray-900">{subject.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtopic Selection */}
                {currentSubject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Subtopic
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {currentSubject.subtopics.map((subtopic) => (
                        <button
                          key={subtopic}
                          type="button"
                          onClick={() => setSelectedSubtopic(subtopic)}
                          className={`px-4 py-2 rounded-lg border transition-all ${
                            selectedSubtopic === subtopic
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {subtopic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Query Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your question
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Explain your question in detail..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Posting...' : 'Post Question'}
                </button>
              </form>
            </div>
          </div>

          {/* Accepted Tutors */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Tutor Responses</h2>
              <p className="text-sm text-gray-500">Tutors who accepted your query</p>
            </div>
            <div className="p-6">
              {acceptedTutors.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tutor responses yet</h3>
                  <p className="text-gray-500">Tutors will appear here when they accept your query</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {acceptedTutors.map((tutor, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {tutor.tutorName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            Rate: ${tutor.rate}/10 minutes
                          </p>
                          {tutor.bio && (
                            <p className="text-sm text-gray-600 mb-2">
                              {tutor.bio}
                            </p>
                          )}
                          {tutor.education && (
                            <p className="text-sm text-gray-500">
                              Education: {tutor.education}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => handleAcceptTutor(tutor)}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Start Session with {tutor.tutorName}
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

export default StudentDashboard;