import cliente from "../services/supabase";

interface ProyectoResumen {
  id: string;
  nombre: string;
}

async function listarProyectosEnSupa(): Promise<string> {
  const { data, error } = await cliente
    .from("proyecto")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error("Error al listar los proyectos: " + error.message);
  }

  if (!data || data.length === 0) {
    return "No hay proyectos registrados en el sistema.";
  }

  // Formatear respuesta clara para la IA
  const proyectos = data as ProyectoResumen[];
  const lista = proyectos
    .map((p, i) => `${i + 1}. ${p.nombre}`)
    .join("\n");

  return `Proyectos disponibles (${proyectos.length}):\n${lista}`;
}

export default listarProyectosEnSupa;
