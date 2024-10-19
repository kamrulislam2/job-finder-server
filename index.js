const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const send = require("send");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.towmtg1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const categoryList = client.db("jobFinder").collection("categoryList");
    const jobs = client.db("jobFinder").collection("jobs");
    const emails = client.db("jobFinder").collection("candidateEmail");

    app.get("/allJobs", async (req, res) => {
      const result = await jobs.find().toArray();
      res.send(result);
    });

    // Add Job
    // app.post("/addJob", async (req, res) => {
    //   const jobData = req.body;
    //   const result = await jobs.insertOne(jobData);
    //   res.send(result);
    //   console.log(jobData);
    // });

    // Add Candidate Email
    app.post("/addEmail", async (req, res) => {
      const email = req.body;
      const result = await emails.insertOne(email);
      //   console.log(email);
      res.send(result);
    });

    app.get("/categoryList", async (req, res) => {
      const result = await categoryList.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job Finder Server Site is running...");
});

app.listen(port, () => {
  console.log("Server is running...");
});
