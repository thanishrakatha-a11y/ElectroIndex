// server.js

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

// --- IMPORTANT ---
// This is your actual MongoDB connection string.
// PLEASE CHANGE YOUR PASSWORD in MongoDB Atlas as soon as possible.
const mongoURI = 'mongodb+srv://thanishrakatha_db_user:NkxlcExEdLLLrHP1@electroindex.lssvqbh.mongodb.net/';
const dbName = 'electroIndexDB'; // You can name your database this
const collectionName = 'parts';

// Middleware to parse JSON and allow cross-origin requests
app.use(cors());
// Increase the limit for JSON payloads (like our base64 image string)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


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

// GET all parts from the database
app.get('/api/parts', async (req, res) => {
  try {
    const parts = await db.collection(collectionName).find().toArray();
    res.json(parts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ message: 'Error fetching parts', error });
  }
});

// POST a new part to the database
app.post('/api/parts', async (req, res) => {
  try {
    const newPart = req.body;
    // The front-end will send the image as a base64 string, so we just save it.
    const result = await db.collection(collectionName).insertOne(newPart);
    // The MongoDB driver for Node.js returns the result in a different format now.
    // We can find the inserted document using the insertedId.
    const insertedDoc = await db.collection(collectionName).findOne({ _id: result.insertedId });
    res.status(201).json(insertedDoc);
  } catch (error) {
    console.error('Error adding part:', error);
    res.status(500).json({ message: 'Error adding part', error });
  }
});

// DELETE a part from the database
app.delete('/api/parts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // MongoDB IDs need to be converted to the ObjectId type for querying
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid part ID format' });
    }
    const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Part not found' });
    }
    res.status(200).json({ message: 'Part deleted successfully' });
  } catch (error) {
    console.error('Error deleting part:', error);
    res.status(500).json({ message: 'Error deleting part', error });
  }
});

// PUT (update) a part in the database
app.put('/api/parts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid part ID format' });
        }
        
        // Exclude the _id field from the update payload
        const { _id, ...updateData } = req.body;

        const result = await db.collection(collectionName).updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Part not found' });
        }
        
        const updatedDoc = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });
        res.status(200).json(updatedDoc);

    } catch (error) {
        console.error('Error updating part:', error);
        res.status(500).json({ message: 'Error updating part', error });
    }
});
