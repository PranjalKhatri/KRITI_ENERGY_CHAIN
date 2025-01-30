import express from "express";
import { createUser, getUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/create", createUser);
router.get("/", getUsers);

export default router;
