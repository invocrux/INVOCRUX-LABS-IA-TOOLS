import cliente from "../services/supabase";

async function buscarProductoEnSupa(
  args: any
): Promise<string> {
  const { nombre_producto } = args;
  console.log('buscando en la base de datos', nombre_producto);
  const { data, error } = await cliente
    .from("inventario")
    .select("*")
    .ilike("producto", `%${nombre_producto}%`);

  if (error) {
    throw new Error("Error al buscar el producto: " + error.message);
  }

  console.log('resultado de busqueda', data);
  if (!data || data.length === 0)
    return "No encontré ningún producto con ese nombre.";
  return JSON.stringify(data);
}

export default buscarProductoEnSupa ;
