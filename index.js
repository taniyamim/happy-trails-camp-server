const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctecrti.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // const usersCollection = client.db("happyDb").collection("users");
        const classesCollection = client.db("happyDb").collection("classes");
        const selectedCollection = client.db("happyDb").collection("selectedClass");

        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray();
            res.send(result);
        })


        // selected classes collection 
        app.post('/selectedClasses', async (req, res) => {
            const cls = req.body;
            const result = await selectedCollection.insertOne(cls);
            res.send(result);
        });








        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('camping is going on')
})

app.listen(port, () => {
    console.log(`Camping is going on port ${port}`);
})