export interface UsuarioModel {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    fechaNacimiento: Date;
    celular: string;
    curp: string;
    username: string;
    email: string;
    password: string;
    sexo: string;
    telefono: string;
    idRol: number;
    estatus: number;
    imagen: string;
}