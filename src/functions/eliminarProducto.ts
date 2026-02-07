import cliente from "../services/supabase";

async function elimnarProductoEnSupa(args: any): Promise<string> {
  console.log("eliminando producto en la base de datos", args);
  const { id_producto } = args;
  const { data, error } = await cliente
    .from("inventario")
    .delete()
    .eq("id", id_producto)
    .select();

  if (error) {
    throw new Error("Error al eliminar el producto: " + error.message);
  }

  console.log("resultado de eliminación", data);
  if (!data) return "No se pudo eliminar el producto.";
  return JSON.stringify(data);
}

export default elimnarProductoEnSupa;
