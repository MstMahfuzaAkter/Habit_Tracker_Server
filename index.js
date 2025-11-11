const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const admin = require("firebase-admin");

const serviceAccount = require("./habit-tracker-b0971-firebase-adminsdk-fbsvc.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
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


const verifyToken = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).send({
            message: "unauthorized access. Token not found!",
        });
    }

    const token = authorization.split(" ")[1];
    try {
        await admin.auth().verifyIdToken(token);

        next();
    } catch (error) {
        res.status(401).send({
            message: "unauthorized access.",
        });
    }
};
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
    console.log(id);

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

app.get("/my-habits/:email", async (req, res) => {
    const { email } = req.params;
    const result = await habitCollection.find({ userEmail: email }).toArray();
    res.send({
        success: true,
        result
    });
});
app.put("/habit/:id", async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    // console.log(id)
    // console.log(data)
    const objectId = new ObjectId(id);
    const filter = { _id: objectId };
    const update = {
        $set: data,
    };

    const result = await habitCollection.updateOne(filter, update);

    res.send({
        success: true,
        result,
    });
});
app.delete("/habit/:id", async (req, res) => {
    const { id } = req.params;
    const result = await habitCollection.deleteOne({ _id: new ObjectId(id) });

    res.send({
        success: true,
        result,
    });
});
app.get("/latest-habit", async (req, res) => {
    const result = await habitCollection
        .find()
        .sort({
            createdAt: "desc"
        })
        .limit(6)
        .toArray();

    console.log(result);

    res.send(result);
});

app.get("/my-habit", async (req, res) => {
    const email = req.query.email;
    const result = await habitCollection.find({ userEmail: email }).toArray();
    res.send(result);
});

app.put("/habit/:id/complete", async (req, res) => {
    const { id } = req.params;
    const objectId = new ObjectId(id);
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    try {
        const habit = await habitCollection.findOne({ _id: objectId });

        if (!habit) {
            return res.status(404).send({ success: false, message: "Habit not found" });
        }

        // Prevent duplicate same-day entry
        if (habit.completionHistory && habit.completionHistory.includes(today)) {
            return res.send({ success: false, message: "Already marked complete today!" });
        }

        // Push today's date into completionHistory array
        const update = {
            $push: { completionHistory: today },
        };

        await habitCollection.updateOne({ _id: objectId }, update);

        // Re-fetch updated habit
        const updatedHabit = await habitCollection.findOne({ _id: objectId });

        // Calculate streak
        const streak = calculateStreak(updatedHabit.completionHistory || []);

        // Update current streak field
        await habitCollection.updateOne({ _id: objectId }, { $set: { currentStreak: streak } });

        res.send({
            success: true,
            message: "Habit marked complete!",
            result: { ...updatedHabit, currentStreak: streak },
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server Error" });
    }
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
