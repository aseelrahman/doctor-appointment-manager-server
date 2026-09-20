import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();
app.use(cors());

const port = process.env.PORT || 5005;
const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("doctimedb");
    const doctorsCollection = db.collection("doctors");

    await doctorsCollection.createIndex({ rating: -1 })
    
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!",
    // );

    // GET /doctors - Retrieve and return all doctors from the database
    app.get("/doctors", async (req, res) => {
      const cursor = doctorsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/doctors/top-rated", async (req, res) => {
      const cursor = doctorsCollection.find().sort({ rating: -1 }).limit(3);
      const result = await cursor.toArray();
      res.send(result);
    })

    // GET /doctors/:doctorId - Retrieve a specific doctor by ID
    app.get("/doctors/:doctorId", async (req, res) => {
      const { doctorId } = req.params;
      const query = { _id: new ObjectId(doctorId) };
      const result = await doctorsCollection.findOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
