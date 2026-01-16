import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";






app.listen(3000, () => {
  console.log("listening on 3000");
});
