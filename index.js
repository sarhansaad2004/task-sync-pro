const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

const corsConfig = {
  origin:['http://localhost:5173' , 'https://tasksync-pro.web.app' , 'tasksync-pro.firebaseapp.com'],
credentials:true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsConfig));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lbqsrfq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run() {
  try {
    const database = client.db("TaskSync");
    const taskCollection = database.collection("Tasks");
   
    app.get("/api/tasks/:email", async (req, res) => {
      const userEmail = req.params.email;
      try {
        const result = await taskCollection
          .find({ email: userEmail })
          .toArray();
        if (result) {
          res.json(result);
        } else {
          res.status(404).send("Data not found");
        }
      } catch (error) {
        console.error("Error finding data", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    app.patch("api/task", async (req, res) => {
      const { id, type, order } = req.body;
      const filter = { _id: new ObjectId(id) };
      console.log(id);
      const data = {
        $set : {
          type : type ,
          order: order
        }
      }
      const result = await taskCollection.updateOne(filter,data);
      res.send(result)
    });

    app.post("/api/tasks", async (req, res) => {
      try {
        const data = req.body;
        const result = await taskCollection.insertOne(data);
        res.send(result);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });

    app.delete("/api/tasks/:id", async (req, res) => {
      try {
        const taskId = req.params.id;

        if (!taskId) {
          return res
            .status(400)
            .json({ message: "Task ID is required for deletion." });
        }

        const result = await taskCollection.deleteOne({
          _id: new ObjectId(taskId),
        });

        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ message: "Task not found." });
        }
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    app.put("/api/tasks/:id", async (req, res) => {
      try {
        const taskId = req.params.id;
        const task = req.body;

        const result = await taskCollection.findOneAndUpdate(
          { _id: new ObjectId(taskId) },
          { $set: task },
          { returnDocument: "after" }
        );

        if (result) {
          res.json(result);
        } else {
          res.status(404).json({ message: "Task not found" });
        }
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    });
   



  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The server is running.");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
