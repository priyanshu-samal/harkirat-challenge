import dotenv from "dotenv";
dotenv.config();
import connectDB from './src/db/db.js'
import app from "./src/app.js";
import { setupWebSocket } from "./src/websocket/ws.js";

connectDB()


const server = app.listen(3000, () => {
  console.log("listening on 3000");
});

setupWebSocket(server);

