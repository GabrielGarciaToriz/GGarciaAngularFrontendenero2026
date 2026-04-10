import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Result } from "../Interfaces/Entity/Result";
import { RolModel } from "../Interfaces/Catalogos/RolModel";
import { PaisModel } from "../Interfaces/Catalogos/PaisModel";
import { EstadoModel } from "../Interfaces/Catalogos/EstadoModel";
import { MunicipioModel } from "../Interfaces/Catalogos/MunicipioModel";
import { ColoniaModel } from "../Interfaces/Catalogos/ColoniaModel";
import { API_ROUTES } from "../app.routes";
@Injectable({
    providedIn: 'root'
})

export class catalogoService {
    private catalogoRol = API_ROUTES.catalogos.rol;

    constructor(private http: HttpClient) { }

    getRoles(): Observable<Result<RolModel>> {
        return this.http.get<Result<RolModel>>(API_ROUTES.catalogos.rol);
    }
    getPaises(): Observable<Result<PaisModel>> {
        return this.http.get<Result<PaisModel>>(API_ROUTES.catalogos.pais);
    }
    getEstados(idPais: number): Observable<Result<EstadoModel>> {
        return this.http.get<Result<EstadoModel>>(API_ROUTES.catalogos.estado.replace(':idPais', idPais.toString()));
    }
    getMunicipios(idEstado: number): Observable<Result<MunicipioModel>> {
        return this.http.get<Result<MunicipioModel>>(API_ROUTES.catalogos.municipio.replace(':idEstado', idEstado.toString()));
    }
    getColonias(idMunicipio: number): Observable<Result<ColoniaModel>> {
        return this.http.get<Result<ColoniaModel>>(API_ROUTES.catalogos.colonia.replace(':idMunicipio', idMunicipio.toString()));
    }
    getByCodigoPostal(codigoPostal: string): Observable<Result<ColoniaModel>> {
        return this.http.get<Result<ColoniaModel>>(API_ROUTES.catalogos.codigoPostal.replace(':codigoPostal', codigoPostal));
    }

}
