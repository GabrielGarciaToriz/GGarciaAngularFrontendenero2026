import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { UsuarioModel } from "../Interfaces/Usuarios/UsuarioModel";
import { Result } from "../Interfaces/Entity/Result";

@Injectable({
    providedIn: 'root'
})
export class UsuarioService {
    private apiUrl = 'http://localhost:8081/api/usuario';

    constructor(private http: HttpClient) { }

    getUsuarios(): Observable<Result<UsuarioModel>> {
        return this.http.get<Result<UsuarioModel>>(this.apiUrl);
    }
    getUsuarioById(id: number): Observable<Result<UsuarioModel>> {
        return this.http.get<Result<UsuarioModel>>(`${this.apiUrl}/${id}`);
    }

    cambiarEstado(id: number, estadoActual: boolean): Observable<Result<UsuarioModel>> {
        const payload = { activo: estadoActual };
        return this.http.put<Result<UsuarioModel>>(`${this.apiUrl}/cambioStatus/${id}/`, payload);
    }
}