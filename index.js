const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ruwopzq.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const db = client.db("habit-db");
const habitCollection = db.collection("habit");
// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })

app.get("/habit", async (req, res) => {
    const result = await habitCollection.find().toArray();
    res.send(result);
});

app.get("/habit/:id", async (req, res) => {
    const { id } = req.params;
    const objectId = new ObjectId(id);

    const result = await habitCollection.findOne({ _id: objectId });

    res.send({
        success: true,
        result,
    });
});
app.post("/habit", async (req, res) => {
    const data = req.body;
    // console.log(data)
    const result = await habitCollection.insertOne(data);
    res.send({
        success: true,
        result,
    });
});

async function run() {
    try {
        //await client.connect();
        //await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
