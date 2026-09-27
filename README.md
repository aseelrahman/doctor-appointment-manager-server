# 🩺 DocTime Server

Backend API for **DocTime**, a doctor appointment management application.

The server handles doctor data, appointment management, MongoDB operations, and JWT-based authentication and authorization.

## 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- MongoDB Node.js Driver
- JOSE
- JWT / JWKS
- CORS
- dotenv

## ✨ Features

- Retrieve all available doctors
- Retrieve top-rated doctors
- Retrieve individual doctor details
- Create appointments
- Retrieve appointments for the authenticated user
- Update existing appointments
- Delete appointments
- JWT-based authentication
- User-specific appointment authorization
- MongoDB database integration

## 🔗 API Endpoints

| Method   | Endpoint                       | Description                           | Protected |
| -------- | ------------------------------ | ------------------------------------- | --------- |
| `GET`    | `/`                            | Check API status                      | No        |
| `GET`    | `/doctors`                     | Get all doctors                       | No        |
| `GET`    | `/doctors/top-rated`           | Get top-rated doctors                 | No        |
| `GET`    | `/doctors/:doctorId`           | Get a doctor by ID                    | Yes       |
| `GET`    | `/appointments`                | Get authenticated user's appointments | Yes       |
| `POST`   | `/appointments`                | Create a new appointment              | Yes       |
| `PATCH`  | `/appointments/:appointmentId` | Update an appointment                 | Yes       |
| `DELETE` | `/appointments/:appointmentId` | Delete an appointment                 | Yes       |

## 🔐 Authentication & Authorization

DocTime uses JWT tokens for protected API requests.

The Express server verifies JWTs using JWKS before allowing access to protected routes.

Authenticated user information is derived from the verified token instead of trusting user identity sent by the client.

Appointment update and delete operations are restricted to appointments belonging to the authenticated user.

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the required environment variables:

```env
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=your_client_url
PORT=5005
```

Do not commit the `.env` file to GitHub.

## 🚀 Run Locally

Clone the repository:

```bash
git clone YOUR_SERVER_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd doctor-appointment-manager-server
```

Install the dependencies:

```bash
npm install
```

Create and configure your `.env` file.

Start the server:

```bash
npm start
```

The API will run locally at:

```text
http://localhost:5005
```

## 🌐 Deployment

The DocTime API is deployed on Vercel and uses MongoDB Atlas for the database.

## 👨‍💻 Author

**Aseel Rahman**
