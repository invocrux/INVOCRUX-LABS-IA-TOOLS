import cliente from "../../services/supabase";

/**
 * Valida si un string es un UUID válido.
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Resuelve un proyecto_id que puede venir como UUID o como nombre.
 * Si es un UUID válido, verifica que exista en la base de datos.
 * Si es un nombre, busca el proyecto y retorna su UUID.
 * 
 * @returns El UUID del proyecto o null si no se encuentra
 */
export async function resolveProyectoId(proyectoIdOrName: string): Promise<string | null> {
  // Si ya es un UUID válido, verificar que exista
  if (isValidUUID(proyectoIdOrName)) {
    const { data: proyecto, error } = await cliente
      .from("proyecto")
      .select("id")
      .eq("id", proyectoIdOrName)
      .single();

    if (error || !proyecto) {
      console.log(`❌ [resolveProyectoId] UUID no existe en la base de datos: "${proyectoIdOrName}"`);
      return null;
    }

    return proyectoIdOrName;
  }

  console.log(`⚠️ [resolveProyectoId] Recibido nombre en lugar de UUID: "${proyectoIdOrName}", buscando...`);

  // Buscar por nombre
  const { data: proyecto, error } = await cliente
    .from("proyecto")
    .select("id")
    .ilike("nombre", proyectoIdOrName)
    .single();

  if (error || !proyecto) {
    console.log(`❌ [resolveProyectoId] No se encontró proyecto con nombre: "${proyectoIdOrName}"`);
    return null;
  }

  console.log(`✅ [resolveProyectoId] Resuelto a UUID: "${proyecto.id}"`);
  return proyecto.id;
}
