import express from "express";
import cardRoutes from "./routes/card.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger.js";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 10000;

// 🔹 API Routes
app.use("/api/card", cardRoutes);

// 🔸 Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 🔸 Root route
app.get("/", (_, res) => {
  res.send(`
    <h1>🧙‍♂️ MTG Card API</h1>
    <p>API สำหรับแนะนำการ์ด Magic: The Gathering</p>
    <ul>
      <li><a href="/api/card/suggest/lightning">/api/card/suggest/lightning</a></li>
      <li><a href="/api-docs">Swagger UI</a></li>
    </ul>
  `);
});

// 🔸 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});
