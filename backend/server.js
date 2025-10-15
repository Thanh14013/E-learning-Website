import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./src/config/mongodb.config.js";
import { connectCloudinary } from "./src/config/cloudinary.config.js";

//App config
const app = express();
const port = process.env.PORT || 3000;
await connectDB();
await connectCloudinary();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// App listens on port
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
