import cliente from "../services/supabase";

async function buscarProductoEnSupa(
  args: any
): Promise<string> {
  const { nombre_producto } = args;
  console.log('buscando en la base de datos', nombre_producto);
  const nombreNormalizado = normalizar(nombre_producto)
  const { data, error } = await cliente
    .from("inventario")
    .select("*")
    .ilike("producto", `%${nombreNormalizado}%`);

  if (error) {
    throw new Error("Error al buscar el producto: " + error.message);
  }

  if (!data || data.length === 0)
    return "No encontré ningún producto con ese nombre.";
  return JSON.stringify(data);
}

function normalizar(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default buscarProductoEnSupa ;
