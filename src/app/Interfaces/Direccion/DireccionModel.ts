import { ColoniaModel } from "../Catalogos/ColoniaModel";

export interface DireccionModel{

    idDireccion?: number;
    calle: string;
    numeroExterior: string;
    numeroInterior?: string;
    colonia: ColoniaModel;
}