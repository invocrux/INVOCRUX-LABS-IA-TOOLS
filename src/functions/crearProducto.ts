import cliente from "../services/supabase";

async function crearProductoEnSupa(args: any): Promise<string> {
  const { nombre_producto, cantidad_producto, precio_producto } = args;
  console.log(
    "creando producto en la base de datos",
    nombre_producto,
    cantidad_producto,
    precio_producto,
  );
  const { data: productoExistente } = await cliente
    .from("inventario")
    .select("id")
    .ilike("producto", nombre_producto)
    .single();

  if (productoExistente) {
    return `Ya existe un producto con ese nombre. No se pueden crear productos duplicados.`;
  }

  const { data, error } = await cliente
    .from("inventario")
    .insert([
      {
        producto: nombre_producto,
        cantidad: cantidad_producto,
        precio: precio_producto,
      },
    ])
    .select();

  if (error) {
    throw new Error("Error al crear el producto: " + error.message);
  }

  console.log("resultado de creación", data);
  if (!data) return "No se pudo crear el producto.";
  return JSON.stringify(data);
}

export default crearProductoEnSupa;
