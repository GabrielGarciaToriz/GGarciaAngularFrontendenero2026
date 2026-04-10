import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
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
    styleUrl: './usuario.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuarioComponent implements OnInit, OnDestroy {
    usuarios: UsuarioModel[] = [];
    mensajeError: string = '';
    cargando: boolean = true;
    private destroy$ = new Subject<void>();
    constructor(private usuarioService: UsuarioService, private cdr: ChangeDetectorRef) { }
    ngOnInit(): void {
        this.getAll();
    }

    getAll() {
        this.usuarioService.getUsuarios()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuesta) => {
                    if (respuesta.correct) {
                        this.usuarios = respuesta.objects || [];
                        console.log(respuesta.objects)
                    } else {
                        this.mensajeError = respuesta.errorMessage || 'Error desconocido al obtener los usuarios.';
                    }
                    this.cargando = false;
                    this.cdr.markForCheck();
                },
                error: (err) => {
                    this.mensajeError = 'Error al conectar con el servidor: ' + (err.message || 'Error desconocido');
                    this.cargando = false;
                    this.cdr.markForCheck();
                    console.error('Error al obtener los usuarios:', err);
                }
            });
    }
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
