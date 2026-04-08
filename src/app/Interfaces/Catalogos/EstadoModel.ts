import { PaisModel } from "./PaisModel";

export interface EstadoModel{
    idEstado : number;
    nombre : string;
    pais: PaisModel;
}