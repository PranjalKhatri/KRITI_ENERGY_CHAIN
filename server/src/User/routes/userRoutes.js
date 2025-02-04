import express from "express";
import { createUser, getUsers,getUserByAccountNumber,updateUserEnergy } from "../controllers/userController.js";

const router = express.Router();

router.post("/create", createUser);
router.get("/", getUsers);
router.get("/:accountNumber", getUserByAccountNumber);
router.put("/:accountNumber/energy", updateUserEnergy);
export default router;
