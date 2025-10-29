// my-react-app/src/pages/tutor/TutorSetup.tsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { storeAuthState, markActiveUserType } from '../../utils/authStorage';
import '../../styles/selectable-options.css';
import '../../styles/form-feedback.css';

const TutorSetup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    education: '',
    specialties: [] as string[],
    ratePer10Min: ''
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
    const { name, value } = e.target;

    if (name === 'ratePer10Min') {
      if (value === '' || /^\d*(?:\.\d{0,2})?$/.test(value)) {
        setFormData({
          ...formData,
          ratePer10Min: value
        });
      }
      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.includes(specialty)
        ? formData.specialties.filter((s: string) => s !== specialty)
        : [...formData.specialties, specialty]
    });
  };

  const passwordsMatch =
    formData.password.length > 0 && formData.password === formData.confirmPassword;
  const showPasswordFeedback = formData.confirmPassword.length > 0;
  const disableSubmit = loading || !passwordsMatch;

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
      const res = await axios.post('http://localhost:3000/api/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        userType: 'tutor',
        bio: formData.bio,
        education: formData.education,
        specialties: formData.specialties,
        ratePer10Min: formData.ratePer10Min ? Number(formData.ratePer10Min) : 0
      });

      const { token, user } = res.data;

      if (token && user) {
        storeAuthState('tutor', token, user);
        markActiveUserType('tutor');
        navigate('/tutor/dashboard');
        return;
      }

      navigate('/tutor/login');
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
              {showPasswordFeedback && (
                <p className={`password-feedback ${passwordsMatch ? 'match' : 'mismatch'}`}>
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
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
              {specialties.map((specialty) => {
                const isSelected = formData.specialties.includes(specialty);
                return (
                  <button
                    key={specialty}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`selectable-pill${isSelected ? ' is-selected' : ''}`}
                  >
                    {specialty}
                  </button>
                );
              })}
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
                placeholder="e.g., 12.5"
                min="0"
                step="0.1"
                max="100"
                required
              />
            <p className="text-sm text-gray-500 mt-1">
              Students pay in 10-minute blocks. Enter 0 for free sessions or use decimals like 12.5.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={disableSubmit}
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
