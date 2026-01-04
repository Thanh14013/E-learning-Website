import express from "express";
import {
  getConversations,
  getMessages,
  startConversation,
  searchChatUsers,
} from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

router.get("/conversations", getConversations);
router.get("/messages/:conversationId", getMessages);
router.post("/conversations", startConversation);
router.get("/users/search", searchChatUsers);

export default router;
