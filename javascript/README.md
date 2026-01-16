# Live Attendance System

## Coding Without AI Assistance to Gauge My Edge in 2026

### Project Overview
This project is a full-stack Live Attendance System designed to facilitate real-time attendance tracking for classrooms. It features a role-based architecture differentiating between Teachers and Students. The system utilizes WebSockets to provide instant updates to student statuses as teachers mark attendance, ensuring synchronization across all connected clients. Data persistence is handled via MongoDB, storing attendance records securely after each session.

### Features

#### Authentication
- Secure Signup and Login functionality for both Teachers and Students.
- JSON Web Token (JWT) based session management.
- Role-based access control ensuring users can only access features pertinent to their role.

#### Teacher Dashboard
- **Class Management**: Teachers can create new classes with unique identifiers.
- **Session Control**: Teachers can initiate live attendance sessions and end them to save data.
- **Student Management**: Teachers can add students to their classes using email addresses.
- **Live Tracking**: Real-time view of connected students and attendance statistics (Present/Absent/Total).

#### Student Dashboard
- **Live Status**: specific display of the student's current attendance status for the active session.
- **Real-time Updates**: Instant status reflection when marked by a teacher without page refreshes.

### Technology Stack

#### Backend
- **Node.js**: Runtime environment for executing JavaScript on the server.
- **Express.js**: Web framework for handling HTTP requests and routing.
- **WebSocket (ws)**: Library for real-time, two-way communication between client and server.
- **MongoDB**: NoSQL database for persistent storage of user, class, and attendance data.
- **Mongoose**: ODM library for MongoDB schema modeling.
- **Zod**: Schema validation for request inputs.
- **Bcrypt**: Library for hashing passwords.
- **JWT**: Standard for secure user authentication.

#### Frontend
- **HTML5**: Structure of the web application.
- **CSS3**: Custom styling implementing a modern dark mode with glassmorphism effects.
- **Vanilla JavaScript**: Client-side logic for DOM manipulation, API interaction, and WebSocket handling.

### Installation and Setup

1. **Prerequisites**
   Ensure Node.js and MongoDB are installed on your machine.

2. **Install Dependencies**
   Navigate to the project directory and run:
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Ensure a `.env` file exists in the root directory with the following variables:
   ```
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the Server**
   Run the following command to start the application:
   ```bash
   npm start
   ```

5. **Access the Application**
   Open your web browser and navigate to `http://localhost:3000`.

### API Routes

#### Authentication
- `POST /api/auth/signup`: Register a new user.
- `POST /api/auth/login`: Authenticate an existing user.
- `GET /api/auth/me`: Retrieve current user details.

#### Class Management
- `POST /api/class`: Create a new class (Teacher only).
- `GET /api/class/:id`: Get class details and enrolled students.
- `POST /api/class/:id/add-student`: Add a student to a class by email.
- `GET /api/students`: List all users with student role.

#### Attendance
- `POST /api/attendance/start`: Initialize a live attendance session (Teacher only).
- `GET /api/attendance/:id`: Get attendance record for a specific class (Student only).

### WebSocket Events

- **ATTENDANCE_MARKED**: Sent specific to the server when a teacher marks a student. Broadcasted back to clients.
- **TODAY_SUMMARY**: Sent to request current session statistics. Broadcasted to clients.
- **MY_ATTENDANCE**: Sent by a student to request their specific status.
- **DONE**: Sent by a teacher to finalize the session and persist data to the database.
- **ERROR**: Sent by the server when an operation fails or permission is denied.
