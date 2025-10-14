# MicroTutor - On-Demand Micro-Tutoring Platform

A real-time tutoring platform that connects students with tutors for instant help in specific subjects. Students can post queries, tutors can accept them, and they can collaborate using an interactive whiteboard and chat system.

## Features

### For Students
- **User Registration & Authentication**: Secure login/signup system
- **Query Posting**: Post questions with subject and subtopic selection
- **Real-time Notifications**: Get notified when tutors accept your queries
- **Tutor Selection**: View tutor profiles and rates before accepting
- **Interactive Whiteboard**: Collaborate with tutors using a shared whiteboard
- **Chat System**: Real-time messaging during sessions

### For Tutors
- **Profile Setup**: Create detailed profiles with bio, education, and specialties
- **Query Management**: View and accept student queries matching your specialties
- **Rate Setting**: Set your rate per 10-minute session
- **Real-time Dashboard**: See new queries and manage accepted ones
- **Interactive Teaching**: Use whiteboard and chat to help students

### Technical Features
- **Real-time Communication**: Socket.IO for instant notifications and chat
- **Interactive Whiteboard**: Canvas-based drawing with pen, eraser, and download features
- **Session Management**: Track active tutoring sessions
- **Responsive Design**: Professional UI that works on all devices
- **Authentication**: JWT-based secure authentication

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Socket.IO Client** for real-time communication
- **Axios** for API calls
- **CSS3** for styling

### Backend
- **Node.js** with Express
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing
- **CORS** for cross-origin requests

### Database
- **In-memory storage** for MVP (can be extended to PostgreSQL)

## Project Structure

```
FL2025-Semester-Project/
├── backend/                 # Node.js backend
│   ├── routes/             # API routes
│   │   ├── auth.js         # User registration
│   │   ├── login.js        # User login
│   │   └── queries.js      # Query management
│   ├── storage.js          # In-memory data storage
│   ├── index.js            # Main server file
│   └── package.json
├── my-react-app/           # React frontend
│   ├── src/
│   │   ├── pages/          # Page components
│   │   │   ├── student/     # Student-specific pages
│   │   │   ├── tutor/       # Tutor-specific pages
│   │   │   └── Landing.tsx # Landing page
│   │   ├── Whiteboard.tsx  # Interactive whiteboard
│   │   ├── SessionRoom.tsx # Session room with chat
│   │   └── MainRouter.tsx  # Routing configuration
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mehaksharma30/cse437-mvp-backup.git
   cd cse437-mvp-backup
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../my-react-app
   npm install
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3000`

2. **Start the frontend development server**
   ```bash
   cd my-react-app
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the application**
   - Open `http://localhost:5173` in your browser
   - The landing page will show options for students and tutors

## Usage

### For Students
1. **Register/Login**: Create an account or sign in
2. **Post a Query**: Select subject (e.g., Computer Science) and subtopic (e.g., Java)
3. **Wait for Responses**: Tutors will see your query and can accept it
4. **Choose a Tutor**: Review tutor profiles and rates
5. **Start Session**: Begin collaborating on the whiteboard

### For Tutors
1. **Setup Profile**: Complete your profile with bio, education, and specialties
2. **Set Your Rate**: Choose your rate per 10-minute session
3. **View Queries**: See student queries matching your specialties
4. **Accept Queries**: Accept queries you want to help with
5. **Teach**: Use the whiteboard and chat to help students

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Queries
- `POST /api/queries/post` - Post a new query
- `GET /api/queries/tutor/:tutorId` - Get queries for a tutor
- `POST /api/queries/accept` - Accept a query
- `POST /api/queries/session` - Create a session
- `PUT /api/queries/profile` - Update tutor profile

## Real-time Features

### Socket.IO Events
- `new-query` - Notify tutors of new queries
- `tutor-accepted` - Notify students of tutor acceptance
- `drawing` - Whiteboard drawing events
- `session-message` - Chat messages in sessions

## Development

### Adding New Features
1. **Frontend**: Add new components in `my-react-app/src/pages/`
2. **Backend**: Add new routes in `backend/routes/`
3. **Real-time**: Add Socket.IO events in `backend/index.js`

### Database Extension
The current MVP uses in-memory storage. To add a real database:
1. Update `backend/storage.js` to use your preferred database
2. Modify routes to use database queries instead of in-memory arrays

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of a semester project for CSE437.

## Contact

For questions or support, please contact the development team.

---

**Note**: This is an MVP (Minimum Viable Product) for demonstration purposes. In a production environment, you would want to add proper database integration, enhanced security, payment processing, and more robust error handling.