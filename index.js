const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// app.use(
//   cors({
//     origin: "*", // Your React app's URL
//     methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
//   })
// );

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE"],
};
app.use(cors(corsOptions));
app.use(express.json());

// Configure Multer for file uploads (PDF resume)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // Gmail account
    pass: process.env.GMAIL_PASS, // Gmail password
  },
});

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
    app.post("/addJob", async (req, res) => {
      const jobData = req.body;
      const result = await jobs.insertOne(jobData);
      res.send(result);
      console.log(jobData);
    });

    // Add Candidate Email
    app.post("/addEmail", async (req, res) => {
      const email = req.body;
      const result = await emails.insertOne(email);
      res.send(result);
    });

    // Add Candidate Email
    app.post("/appliedJob", upload.single("resume"), async (req, res) => {
      const { name, email, phone, jobTitle, companyName, yourself } = req.body;
      const resumePath = req.file.path; // Path to the uploaded resume

      // Set up email options
      const mailOptions = {
        from: email, // Applicant's email
        to: process.env.GMAIL_USER, // Your Gmail account
        subject: `New Application for ${jobTitle} at ${companyName}`,
        text: `
      A new job application has been submitted:

      Name: ${name}
      Email: ${email}
      Phone: ${phone}
      Job Title: ${jobTitle}
      Company Name: ${companyName}
      About Myself: ${yourself}

      Resume attached.
    `,
        attachments: [
          {
            filename: req.file.originalname,
            path: resumePath, // The uploaded resume PDF file
          },
        ],
      };

      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          return res.status(500).send("Error sending email");
        }

        // Delete the uploaded resume file after sending the email
        if (fs.existsSync(resumePath)) {
          fs.unlink(resumePath, (err) => {
            if (err) {
              console.error("Error deleting file:", err);
            } else {
              console.log("File deleted successfully");
            }
          });
        } else {
          console.log("File does not exist:", resumePath);
        }

        console.log("Email sent:", info.response);
        const result = await emails.insertOne({ email: email });
        res.status(200).send(result);
      });

      // jobApplicationInfo(jobData);
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
