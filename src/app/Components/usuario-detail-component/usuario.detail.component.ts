import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { UsuarioService } from "../../Services/usuario.service";
import { UsuarioModel } from "../../Interfaces/Usuarios/UsuarioModel";

@Component({
    selector: 'app-usuario-detail-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './usuario.detail.component.html',
    styleUrl: './usuario.detail.component.css'
})

export class UsuarioDetailComponent implements OnInit {
    usuario: UsuarioModel | null = null;
    mensajeError: string = '';
    constructor(private usuarioService: UsuarioService) { }
    ngOnInit(): void {
    }

    getUsuarioById(id: number) {
        this.usuarioService.getUsuarioById(id).subscribe({
            next: (respuesta) => {
                if (respuesta.correct) {
                    this.usuario = respuesta.object || null;
                    console.log(respuesta.object)
                }
            },
            error: (err) => {
                this.mensajeError = 'Error al conectar con el servidor: ' + (err.message || 'Error desconocido');
                console.error(err);
            }
        });
    }
}