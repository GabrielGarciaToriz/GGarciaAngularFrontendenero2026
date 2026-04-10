import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { UsuarioModel } from "../../Interfaces/Usuarios/UsuarioModel";
import { UsuarioService } from "../../Services/usuario.service";
import { catalogoService } from "../../Services/catalogo.service";
import { RolModel } from "../../Interfaces/Catalogos/RolModel";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { email } from "@angular/forms/signals";
import { ColoniaModel } from "../../Interfaces/Catalogos/ColoniaModel";
import { MunicipioModel } from "../../Interfaces/Catalogos/MunicipioModel";
import { EstadoModel } from "../../Interfaces/Catalogos/EstadoModel";
import { PaisModel } from "../../Interfaces/Catalogos/PaisModel";
import { DireccionModel } from "../../Interfaces/Direccion/DireccionModel";


@Component({
    selector: 'app-form-component',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './usuario.form.component.html',
    styleUrl: './usuario.form.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormComponent implements OnInit {
    public usuario: UsuarioModel | undefined
    roles: RolModel[] = [];
    colonias: ColoniaModel[] = [];
    municipio: MunicipioModel[] = [];
    estado: EstadoModel[] = [];
    pais: PaisModel[] = [];
    mensajeError: string = '';
    cargando: boolean = true;

    private formularioReactivo = inject(FormBuilder);
    private destroy$ = new Subject<void>();

    constructor(
        private catalogoService: catalogoService,
        private cdr: ChangeDetectorRef,
        private usuarioService: UsuarioService
    ) { }



    public form: FormGroup = this.formularioReactivo.group({
        userName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        rol: [null, Validators.required],
        nombre: ['', Validators.required],
        apellidoPaterno: ['', Validators.required],
        apellidoMaterno: [''],
        fechaNacimiento: ['', Validators.required],
        curp: ['', Validators.required],
        sexo: ['', Validators.required],
        celular: [''],
        telefono: [''],
        estatus: [1],
        imagen: [''],
        direcciones: this.formularioReactivo.group({
            calle: ['', Validators.required],
            numeroExterior: ['', Validators.required],
            numeroInterior: [''],
            idColonia: [null, Validators.required]
        })
    })

    ngOnInit(): void {
        this.getRoles();
    }

    public enviarDatos() {
        if (this.form.valid) {
            this.form.markAllAsTouched();
            return;
        }
        const formValue = this.form.value;
        const rolSeleccionado = this.roles.find(rol => rol.idRol === formValue.rol);
        const coloniasSeleccionada = this.colonias.find(colonia => colonia.idColonia === formValue.direcciones.idColonia);

        const direccion: DireccionModel = {
            calle: formValue.direcciones.calle,
            numeroExterior: formValue.direcciones.numeroExterior,
            numeroInterior: formValue.direcciones.numeroInterior,
            colonia: coloniasSeleccionada!
        }

        this.usuario = {
            ...formValue,
            rol: rolSeleccionado!,
            direcciones: [direccion]
        } as UsuarioModel

        this.usuarioService.addUsuario(this.usuario)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuesta) => {
                    if (respuesta.correct) {
                        console.log('Usuario creado:', respuesta.object);
                    } else {
                        this.mensajeError = respuesta.errorMessage || 'Error desconocido al crear el usuario.';
                    }
                }
            });
    }

    getRoles() {
        this.catalogoService.getRoles()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuesta) => {
                    this.roles = respuesta.objects || [];
                    this.cargando = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    this.mensajeError = 'Error al obtener los roles';
                    this.cargando = false;
                    this.cdr.markForCheck();
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}