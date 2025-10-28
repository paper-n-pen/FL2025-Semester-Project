// my-react-app/src/pages/tutor/TutorProfile.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuthStateForType, storeAuthState, markActiveUserType } from '../../utils/authStorage';

const TutorProfile = () => {
  const [formData, setFormData] = useState({
    bio: '',
    education: '',
    specialties: [] as string[],
    ratePer10Min: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const _availableSubjects = [
    'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 
    'Biology', 'English', 'History', 'Economics', 'Psychology'
  ];

  const availableSpecialties = [
    'Java', 'Python', 'JavaScript', 'C++', 'Data Structures', 'Algorithms',
    'Calculus', 'Linear Algebra', 'Statistics', 'Probability',
    'Mechanics', 'Thermodynamics', 'Electromagnetism', 'Quantum Physics',
    'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
    'Cell Biology', 'Genetics', 'Molecular Biology',
    'Creative Writing', 'Literature Analysis', 'Grammar',
    'World History', 'American History', 'European History',
    'Microeconomics', 'Macroeconomics', 'Finance',
    'Cognitive Psychology', 'Social Psychology', 'Developmental Psychology'
  ];

  useEffect(() => {
    const stored = getAuthStateForType('tutor');
    if (stored.user) {
      markActiveUserType('tutor');
      setFormData({
        bio: stored.user.bio || '',
        education: stored.user.education || '',
        specialties: stored.user.specialties || [],
        ratePer10Min: stored.user.ratePer10Min || 0
      });
    } else {
      navigate('/tutor/login');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({
      ...prev,
      [name]: name === 'ratePer10Min' ? Number(value) : value
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s: string) => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const stored = getAuthStateForType('tutor');
      if (!stored.user) {
        navigate('/tutor/login');
        return;
      }

      const _response = await axios.put('http://localhost:3000/api/queries/profile', {
        ...formData,
        userId: stored.user.id
      });

      // Update the stored tutor profile
      const updatedUser = { ...stored.user, ...formData };
      storeAuthState('tutor', stored.token, updatedUser);
      markActiveUserType('tutor');

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/tutor/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">MT</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">MicroTutor</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/tutor/dashboard')}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Edit Your Profile</h1>
            <p className="text-gray-600">Update your information to help students find you</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Tell students about your teaching experience and expertise..."
                required
              />
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Education
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., MS Computer Science, Stanford University"
                required
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Specialties (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableSpecialties.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      formData.specialties.includes(specialty)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.specialties.length} specialties
              </p>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate per 10 minutes ($)
              </label>
              <input
                type="number"
                name="ratePer10Min"
                value={formData.ratePer10Min}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 15"
                min="1"
                max="100"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Students will see this rate when you accept their queries
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/tutor/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TutorProfile;
