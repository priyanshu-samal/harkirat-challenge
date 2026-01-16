import dotenv from "dotenv";
dotenv.config();
import connectDB from './src/db/db.js'
import app from "./src/app.js";

connectDB()




app.listen(3000, () => {
  console.log("listening on 3000");
});
