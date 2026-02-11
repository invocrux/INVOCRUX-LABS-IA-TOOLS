import cliente from "../services/supabase";

async function listarProductoEnSupa(): Promise<string> {
  const { data, error } = await cliente.from("inventario").select("*");

  if (error) {
    throw new Error("Error al listar los productos: " + error.message);
  }

  if (!data || data.length === 0)
    return "No encontré ningún producto en el inventario.";
  return JSON.stringify(data);
}

export default listarProductoEnSupa;
