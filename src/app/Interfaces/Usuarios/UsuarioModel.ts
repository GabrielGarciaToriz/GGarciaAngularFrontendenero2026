import { RolModel } from "../Catalogos/RolModel";
import { DireccionModel } from "../Direccion/DireccionModel";

export interface UsuarioModel {
    idUsuario: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    celular: string;
    curp: string;
    userName: string;
    email: string;
    password: string;
    sexo: string;
    telefono: string;
    fechaNacimiento: string;
    estatus: number;
    imagen: string;
    rol: RolModel;
    direcciones? :DireccionModel[];
}