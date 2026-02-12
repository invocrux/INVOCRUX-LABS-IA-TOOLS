import z from "zod";
import { Request, Response } from "express";
import { processChat } from "../../services/chatService.service";

const ChatRequestSchema = z.object({
  userId: z.string().min(1, "userId es requerido"),
  mensaje: z.string().min(1, "mensaje es requerido"),
});

export async function handleChat(req: Request, res: Response): Promise<void> {
  const { userId, mensaje } = ChatRequestSchema.parse(req.body);
  const data = await processChat(userId, mensaje);

  res.status(200).json({
    success: true,
    data,
    timeStamp: new Date().toISOString(),
  });
}
