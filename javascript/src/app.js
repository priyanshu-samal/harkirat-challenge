import express from "express";
import cookieParser from "cookie-parser";
import routes from "./routes/routes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));





app.use("/api", routes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

export default app;
