import cliente from "../services/supabase";

async function actualizarProductoEnSupa(args: any): Promise<string> {
  const { id_producto, cantidad_producto, precio_producto } = args;
  const updateData: any = {};
  if (cantidad_producto !== undefined) updateData.cantidad = cantidad_producto;
  if (precio_producto !== undefined) updateData.precio = precio_producto;

  const { data, error } = await cliente
    .from("inventario")
    .update(updateData)
    .eq("id", id_producto)
    .select();

  if (error) {
    throw new Error("Error al actualizar el stock: " + error.message);
  }

  if (!data) return "No se pudo actualizar el producto.";
  return JSON.stringify(data);
}

export default actualizarProductoEnSupa;
