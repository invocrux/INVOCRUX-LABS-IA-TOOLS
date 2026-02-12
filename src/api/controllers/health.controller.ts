import { Request, Response } from "express";

export async function health(req: Request, res:Response): Promise<void> {
    try {
        const health = {
            status: 'Todo Funcionando',
            timestamp: new Date().toISOString(),
            service: "aymara-backend",
            version: "1.0.0"
        };

        res.status(200).json(health)
    } catch (error) {
        res.status(500).json({
            status: 'Algo salio mal',
            timestamp: new Date().toISOString(),
            error: "Error desconocido"
        })
    }
}