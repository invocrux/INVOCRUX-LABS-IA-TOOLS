import cliente from "../services/supabase";

async function listarProyectosEnSupa(): Promise<string> {
  const { data, error } = await cliente.from("proyecto").select("*");

  if (error) {
    throw new Error("Error al listar los proyectos: " + error.message);
  }

  if (!data || data.length === 0)
    return "No encontré ningún proyecto en Habitat.";
  return JSON.stringify(data);
}

export default listarProyectosEnSupa;
