import { IMetadataAgente } from "../interfaces/interface";
import { busquedaMetadata } from "./metada/busquedaMetadata";
import { gestionInventarioMetadata } from "./metada/gestionInventarioMetadata";
import { reportesMetadata } from "./metada/reportesMedata";


export const agentesDisponibles: IMetadataAgente[] = [
    busquedaMetadata,
    gestionInventarioMetadata,
    reportesMetadata
]

