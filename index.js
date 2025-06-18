import express from "express";
import cardRoutes from "./routes/card.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 10000;

app.use("/api/card", cardRoutes);

if (fs.existsSync("./swagger.json")) {
  const swaggerDoc = JSON.parse(fs.readFileSync("./swagger.json", "utf8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

app.get("/", (_, res) => {
  res.send("MTG Card API with Puppeteer is running 🚀");
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
