import express from "express";
import cors from "cors";
import claimRoutes from "./routes/claim.routes.js";
import "dotenv/config";


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", claimRoutes);

app.get("/", (_, res) => {
  res.send("Claim backend running");
});

app.listen(5174, () => {
  console.log("🚀 Backend running on http://localhost:5174");
});
