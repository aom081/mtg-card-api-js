import express from "express";
import dotenv from "dotenv";
import cardRouter from "../routes/card.js";
import swaggerUi from "swagger-ui-express";
import swaggerDoc from "../docs/swagger.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use("/api/card", cardRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));

app.get("/", (req, res) => {
  res.send("🔮 Welcome to MTG Card API (JS Edition)");
});

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`);
});
