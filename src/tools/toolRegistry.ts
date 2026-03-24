import listarProyectosEnSupa from "../functions/listarProyectos";
import listarFasesDeProyecto from "../functions/listarFases";
import listarColumnasDeProyecto from "../functions/listarColumnas";
import buscarBeneficiariosPorCedula from "../functions/buscarBeneficiariosPorCedula";
import buscarBeneficiariosPorNombre from "../functions/buscarBeneficiariosPorNombre";
import obtenerFaseBeneficiario from "../functions/obtenerFaseBeneficiario";
import actualizarCampoBeneficiarios from "../functions/actualizarCampoBeneficiarios";
import obtenerExcelSubido from "../functions/obtenerExcelSubido";
import configurarProyectoExcel from "../functions/configurarProyectoExcel";
import previsualizarProyectoExcel from "../functions/previsualizarProyectoExcel";
import crearProyectoDesdeExcel from "../functions/crearProyectoDesdeExcel";

const toolRegistry: { [key: string]: (args: any) => Promise<string> } = {
  listar_proyectos: () => listarProyectosEnSupa(),
  listar_fases: (args) => listarFasesDeProyecto(args.proyecto_id),
  listar_columnas: (args) => listarColumnasDeProyecto(args.proyecto_id),
  buscar_beneficiarios_por_cedula: (args) =>
    buscarBeneficiariosPorCedula(args.proyecto_id, args.cedulas),
  buscar_beneficiarios_por_nombre: (args) =>
    buscarBeneficiariosPorNombre(args.proyecto_id, args.nombres),
  obtener_fase_beneficiario: (args) =>
    obtenerFaseBeneficiario(args.proyecto_id, args.busqueda, args.tipo_busqueda),
  actualizar_campo_beneficiarios: (args) =>
    actualizarCampoBeneficiarios(
      args.proyecto_id,
      args.cedulas,
      args.nombre_columna,
      args.nuevo_valor,
      args.usuario_id
    ),
  // Excel + Project Creation Tools
  obtener_excel_subido: (args) => obtenerExcelSubido(args.usuario_id),
  configurar_proyecto_excel: (args) =>
    configurarProyectoExcel(args.usuario_id, args.campo, args.valor),
  previsualizar_proyecto_excel: (args) =>
    previsualizarProyectoExcel(args.usuario_id),
  crear_proyecto_desde_excel: (args) =>
    crearProyectoDesdeExcel(args.usuario_id),
};

export async function ejecutarTool(nombre: string, args: any): Promise<string> {
  const toolFunction = toolRegistry[nombre];
  if (!toolFunction) throw new Error(`Herramienta no encontrada: ${nombre}`);
  const resultado = await toolFunction(args);
  return resultado;
}

export default toolRegistry;
