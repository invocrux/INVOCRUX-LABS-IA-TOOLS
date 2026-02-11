import actualizarProductoEnSupa from "../functions/actualizarProducto";
import buscarProductoEnSupa from "../functions/buscarProducto";
import crearProductoEnSupa from "../functions/crearProducto";
import elimnarProductoEnSupa from "../functions/eliminarProducto";
import listarProductoEnSupa from "../functions/listarProducto";

const toolRegistry: { [key: string]: (args: any) => Promise<string> } = {
  actualizar_producto: actualizarProductoEnSupa, 
  buscar_producto: buscarProductoEnSupa,
  crear_producto: crearProductoEnSupa, 
  eliminar_producto: elimnarProductoEnSupa,
  listar_productos: listarProductoEnSupa,
};

export async function ejecutarTool(nombre: string, args: any): Promise<string> {
  const toolFunction = toolRegistry[nombre];
  if (!toolFunction) throw new Error(`Herramienta no encontrada: ${nombre}`);
  const resultado = await toolFunction(args);
  return resultado;
}

export default toolRegistry;
