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

  const proyectos = data as ProyectoResumen[];

  // Formato para la IA: JSON con los datos + instrucción de cómo mostrar
  // La IA recibe el ID pero sabe que NO debe mostrarlo al usuario
  const respuesta = {
    instruccion: "Muestra solo los NOMBRES de los proyectos al usuario. Los IDs son para uso interno, NO los muestres.",
    proyectos: proyectos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
    })),
    total: proyectos.length,
  };

  return JSON.stringify(respuesta);
}

export default listarProyectosEnSupa;
