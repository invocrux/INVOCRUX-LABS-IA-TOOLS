import { Request, Response } from "express";
import * as XLSX from "xlsx";
import cliente from "../../services/supabase";

export async function handleUpload(req: Request, res: Response): Promise<void> {
  const file = req.file;
  const userId = req.body.userId;

  if (!file) {
    res.status(400).json({ success: false, error: "No se envió ningún archivo." });
    return;
  }

  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    res.status(400).json({ success: false, error: "userId es requerido." });
    return;
  }

  // Parsear Excel desde el buffer en memoria
  const workbook = XLSX.read(file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const datos: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  if (datos.length === 0) {
    res.status(400).json({ success: false, error: "El archivo Excel está vacío." });
    return;
  }

  const columnas = Object.keys(datos[0]);

  // Guardar en excel_temporal (upsert por user_id)
  const { error } = await cliente.from("excel_temporal").upsert(
    {
      user_id: userId,
      nombre_archivo: file.originalname,
      columnas,
      datos,
      total_filas: datos.length,
      configuracion: {},
    },
    { onConflict: "user_id" }
  );

  if (error) {
    res.status(500).json({ success: false, error: "Error al guardar el archivo: " + error.message });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      nombreArchivo: file.originalname,
      totalFilas: datos.length,
      columnas,
      muestra: datos.slice(0, 3),
    },
  });
}
