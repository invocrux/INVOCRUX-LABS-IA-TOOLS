import listarProyectosEnSupa from "../functions/listarProyectos";
import listarFasesDeProyecto from "../functions/listarFases";
import listarColumnasDeProyecto from "../functions/listarColumnas";
import buscarBeneficiariosPorCedula from "../functions/buscarBeneficiarios";
import actualizarCampoBeneficiarios from "../functions/actualizarCampoBeneficiarios";

const toolRegistry: { [key: string]: (args: any) => Promise<string> } = {
  listar_proyectos: () => listarProyectosEnSupa(),
  listar_fases: (args) => listarFasesDeProyecto(args.proyecto_id),
  listar_columnas: (args) => listarColumnasDeProyecto(args.proyecto_id, args.fase),
  buscar_beneficiarios: (args) => buscarBeneficiariosPorCedula(args.proyecto_id, args.cedulas),
  actualizar_campo_beneficiarios: (args) =>
    actualizarCampoBeneficiarios(
      args.proyecto_id,
      args.cedulas,
      args.nombre_columna,
      args.nuevo_valor,
      args.usuario_id
    ),
};

export async function ejecutarTool(nombre: string, args: any): Promise<string> {
  const toolFunction = toolRegistry[nombre];
  if (!toolFunction) throw new Error(`Herramienta no encontrada: ${nombre}`);
  const resultado = await toolFunction(args);
  return resultado;
}

export default toolRegistry;
