// server.js

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

// --- IMPORTANT ---
// Replace this with your actual MongoDB connection string
const mongoURI = 'mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority';
const dbName = 'mongodbVSCodePlaygroundDB'; // Or whatever you named your database
const collectionName = 'parts';

// Middleware
app.use(cors()); // Allows requests from your front-end
app.use(express.json()); // Allows the server to understand JSON data

let db;

// Connect to MongoDB when the server starts
MongoClient.connect(mongoURI)
  .then(client => {
    console.log('Connected to MongoDB successfully!');
    db = client.db(dbName);
    
    // Start the server only after the database is connected
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to connect to MongoDB', error);
    process.exit(1); // Exit if the database connection fails
  });

// --- API Routes ---

// GET all parts
app.get('/api/parts', async (req, res) => {
  try {
    const parts = await db.collection(collectionName).find().toArray();
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching parts', error });
  }
});

// POST a new part
app.post('/api/parts', async (req, res) => {
  try {
    const newPart = req.body;
    const result = await db.collection(collectionName).insertOne(newPart);
    res.status(201).json(result.ops[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error adding part', error });
  }
});

// DELETE a part
app.delete('/api/parts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Part not found' });
    }
    res.status(200).json({ message: 'Part deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting part', error });
  }
});

// Note: A PUT route for updating would be similar to the POST and DELETE routes.