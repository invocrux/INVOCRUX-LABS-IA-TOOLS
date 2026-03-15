import z from "zod";
import { Request, Response } from "express";
import { clearSesion, cargarSesion } from "../../repositories/sessionRepository";

const UserIdSchema = z.object({
  userId: z.string().min(1, "userId es requerido"),
});

export async function handleGetSession(
  req: Request,
  res: Response
): Promise<void> {
  const { userId } = UserIdSchema.parse(req.query);

  const chatHistory = await cargarSesion(userId);

  res.status(200).json({
    success: true,
    data: { chatHistory },
    timeStamp: new Date().toISOString(),
  });
}

export async function handleClearSession(
  req: Request,
  res: Response
): Promise<void> {
  const { userId } = UserIdSchema.parse(req.body);
  
  await clearSesion(userId);

  res.status(200).json({
    success: true,
    message: "Sesión limpiada correctamente",
    timeStamp: new Date().toISOString(),
  });
}
