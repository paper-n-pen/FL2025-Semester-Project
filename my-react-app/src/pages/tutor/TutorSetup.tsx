// my-react-app/src/pages/tutor/TutorSetup.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TutorSetup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    education: '',
    specialties: [] as string[],
    ratePer10Min: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const specialties = [
    'Java', 'Python', 'JavaScript', 'C++', 'Data Structures', 'Algorithms',
    'Web Development', 'Machine Learning', 'Calculus', 'Linear Algebra', 'Statistics', 'Probability',
    'Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics',
    'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
    'Cell Biology', 'Genetics', 'Molecular Biology',
    'Creative Writing', 'Literature Analysis', 'Grammar',
    'World History', 'American History', 'European History',
    'Microeconomics', 'Macroeconomics', 'Finance',
    'Cognitive Psychology', 'Social Psychology', 'Developmental Psychology'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.includes(specialty)
        ? formData.specialties.filter(s => s !== specialty)
        : [...formData.specialties, specialty]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.specialties.length === 0) {
      setError('Please select at least one specialty');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        userType: 'tutor',
        bio: formData.bio,
        education: formData.education,
        specialties: formData.specialties,
        ratePer10Min: formData.ratePer10Min
      });
      navigate('/tutor/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tutor Setup</h1>
          <p className="text-gray-600">Create your tutor profile to start helping students.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="Create a password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          {/* Education */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Education Background
            </label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="input"
              placeholder="e.g., B.S. Computer Science, MIT"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="input textarea"
              placeholder="Tell students about your experience and teaching style..."
              rows={4}
              required
            />
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Specialties
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  type="button"
                  onClick={() => handleSpecialtyToggle(specialty)}
                  className={`p-3 rounded-lg border transition-all ${
                    formData.specialties.includes(specialty)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {specialty}
                </button>
              ))}
            </div>
          </div>

          {/* Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rate per 10 minutes (in $)
            </label>
            <input
              type="number"
              name="ratePer10Min"
              value={formData.ratePer10Min}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 15"
              min="1"
              max="100"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Students pay in 10-minute blocks. Set your rate accordingly.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Creating Profile...' : 'Create Tutor Profile'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TutorSetup;
