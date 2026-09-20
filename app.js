import {client,response,responses} from "./test"
const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());
app.post("/chat",response(req,res));
app.listen(3000,()=>console.log("server chay tai 3000"))