import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { UsuarioModel } from "../../Interfaces/Usuarios/UsuarioModel";
import { UsuarioService } from "../../Services/usuario.service";

@Component({
    selector: 'app-usuario-component',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './usuario.component.html',
    styleUrl: './usuario.component.css'
})
export class UsuarioComponent implements OnInit {
    usuarios: UsuarioModel[] = [];
    mensajeError: string = '';
    constructor(private usuarioService: UsuarioService) { }
    ngOnInit(): void {
        this.getAll();
    }

    getAll() {
        this.usuarioService.getUsuarios().subscribe({
            next: (respuesta) => {
                if (respuesta.correct) {
                    this.usuarios = respuesta.objects || [];
                    console.log(respuesta.objects)
                } else {
                    this.mensajeError = respuesta.errorMessage || 'Error desconocido al obtener los usuarios.';
                }
            },
            error: (err) => {
                this.mensajeError = 'Error al conectar con el servidor: ' + (err.message || 'Error desconocido');
                console.error(err);
            }
        });
    }
     getAllById(id: number){
        this.usuarioService.getUsuarioById(id).subscribe({
            next:(respuesta)=>{
                if(respuesta.correct){
                    this.usuarios = respuesta.objects || [];
                    console.log(respuesta.objects)
                }
            }
        })
     }
    

}
