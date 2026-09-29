import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();
const port = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db("doctimedb");
const doctorsCollection = db.collection("doctors");
const appointmentsCollection = db.collection("appointments");

// JWT
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.CLIENT_URL,
      audience: process.env.CLIENT_URL,
    });

    req.user = payload;

    next();
  } catch (error) {
    console.error("Token validation failed:", error);

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

// -------------------------
// Home
// -------------------------

app.get("/", (req, res) => {
  res.send("DocTime API is running!");
});

// -------------------------
// Doctors
// -------------------------

// Get all doctors
app.get("/doctors", async (req, res) => {
  try {
    const { search } = req.query;

    const query = {};

    if (search) {
      if (search) {
        query.name = {
          $regex: search,
          $options: "i",
        };
      }
    }

    const doctors = await doctorsCollection.find(query).toArray();

    res.status(200).send(doctors);
  } catch (error) {
    console.error("Failed to fetch doctors:", error);

    res.status(500).json({
      message: "Failed to fetch doctors",
    });
  }
});

// Get top-rated doctors
app.get("/doctors/top-rated", async (req, res) => {
  try {
    const doctors = await doctorsCollection
      .find()
      .sort({ rating: -1 })
      .limit(3)
      .toArray();

    res.status(200).send(doctors);
  } catch (error) {
    console.error("Failed to fetch top doctors:", error);

    res.status(500).json({
      message: "Failed to fetch top doctors",
    });
  }
});

// Get doctor by ID
app.get("/doctors/:doctorId", verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        message: "Invalid Doctor Id",
      });
    }

    const doctor = await doctorsCollection.findOne({
      _id: new ObjectId(doctorId),
    });

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    res.status(200).send(doctor);
  } catch (error) {
    console.error("Failed to fetch doctor:", error);

    res.status(500).json({
      message: "Failed to fetch doctor",
    });
  }
});

// -------------------------
// Appointments
// -------------------------

// Get current user's appointments
app.get("/appointments", verifyToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.sub);

    const appointments = await appointmentsCollection
      .aggregate([
        {
          $match: {
            userId,
          },
        },
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },
        {
          $unwind: "$doctor",
        },
      ])
      .toArray();

    res.status(200).send(appointments);
  } catch (error) {
    console.error("Failed to fetch appointments:", error);

    res.status(500).json({
      message: "Failed to fetch appointments",
    });
  }
});

// Create appointment
app.post("/appointments", verifyToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { doctorId, gender, phone, date, time, reason } = req.body;

    if (!ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        message: "Invalid Doctor Id",
      });
    }

    const appointment = {
      userId: new ObjectId(userId),
      doctorId: new ObjectId(doctorId),
      gender,
      phone,
      date,
      time,
      reason,
      status: "pending",
      createdAt: new Date(),
    };

    const result = await appointmentsCollection.insertOne(appointment);

    res.status(201).send(result);
  } catch (error) {
    console.error("Failed to create appointment:", error);

    res.status(500).json({
      message: "Failed to create appointment",
    });
  }
});

// Update appointment
app.patch("/appointments/:appointmentId", verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        message: "Invalid Appointment Id",
      });
    }

    const userId = new ObjectId(req.user.sub);

    const { date, phone, time, reason } = req.body;

    const updates = {};

    if (date !== undefined) {
      updates.date = date;
    }

    if (phone !== undefined) {
      updates.phone = phone;
    }

    if (time !== undefined) {
      updates.time = time;
    }

    if (reason !== undefined) {
      updates.reason = reason;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    const result = await appointmentsCollection.updateOne(
      {
        _id: new ObjectId(appointmentId),
        userId,
      },
      {
        $set: updates,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      message: "Appointment updated successfully",
    });
  } catch (error) {
    console.error("Failed to update appointment:", error);

    res.status(500).json({
      message: "Failed to update appointment",
    });
  }
});

// Delete appointment
app.delete("/appointments/:appointmentId", verifyToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        message: "Invalid Appointment Id",
      });
    }

    const userId = new ObjectId(req.user.sub);

    const result = await appointmentsCollection.deleteOne({
      _id: new ObjectId(appointmentId),
      userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete appointment:", error);

    res.status(500).json({
      message: "Failed to delete appointment",
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`DocTime API running on port ${port}`);
});
