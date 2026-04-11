import {
    Component, OnInit, OnDestroy,
    ChangeDetectorRef, ChangeDetectionStrategy, inject
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject } from "rxjs";
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, filter } from "rxjs/operators";
import { UsuarioModel } from "../../Interfaces/Usuarios/UsuarioModel";
import { UsuarioService } from "../../Services/usuario.service";
import { catalogoService } from "../../Services/catalogo.service";
import { RolModel } from "../../Interfaces/Catalogos/RolModel";
import { ColoniaModel } from "../../Interfaces/Catalogos/ColoniaModel";
import { DireccionModel } from "../../Interfaces/Direccion/DireccionModel";
import {
    FormBuilder, FormGroup, FormArray,
    Validators, ReactiveFormsModule
} from '@angular/forms';

@Component({
    selector: 'app-form-component',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './usuario.form.component.html',
    styleUrl: './usuario.form.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormComponent implements OnInit, OnDestroy {

    public usuario: UsuarioModel | undefined;
    roles: RolModel[] = [];
    mensajeError: string = '';
    cargando: boolean = true;

    cpBuscando: boolean[] = [false];
    cpError: string[] = [''];

    private fb = inject(FormBuilder);
    private destroy$ = new Subject<void>();

    constructor(
        private catalogoService: catalogoService,
        private cdr: ChangeDetectorRef,
        private usuarioService: UsuarioService
    ) { }

    public form: FormGroup = this.fb.group({
        userName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        idRol: [null, Validators.required],
        nombre: ['', Validators.required],
        apellidoPaterno: ['', Validators.required],
        apellidoMaterno: [''],
        fechaNacimiento: ['', Validators.required],
        curp: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
        sexo: ['', Validators.required],
        celular: [''],
        telefono: [''],
        estatus: [1],
        imagen: [''],
        direcciones: this.fb.array([
            this.crearDireccionGroup()
        ])
    });

    crearDireccionGroup(): FormGroup {
        return this.fb.group({
            codigoPostal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
            calle: ['', Validators.required],
            numeroExterior: ['', Validators.required],
            numeroInterior: [''],
            pais: [{ value: '', disabled: true }],
            estado: [{ value: '', disabled: true }],
            municipio: [{ value: '', disabled: true }],
            idColonia: [{ value: null, disabled: true }, Validators.required],
            _colonias: [[]]
        });
    }

    get direccionesArray(): FormArray {
        return this.form.get('direcciones') as FormArray;
    }

    getDireccionGroup(i: number): FormGroup {
        return this.direccionesArray.at(i) as FormGroup;
    }

    getColoniasDir(i: number): ColoniaModel[] {
        return this.getDireccionGroup(i).get('_colonias')?.value || [];
    }

    ngOnInit(): void {
        this.getRoles();
        this.suscribirCP(0); 
    }

    private suscribirCP(index: number): void {
        const cpControl = this.getDireccionGroup(index).get('codigoPostal')!;

        cpControl.valueChanges.pipe(
            debounceTime(500),                         
            distinctUntilChanged(),                     
            filter((cp: string) => /^\d{5}$/.test(cp)), 
            switchMap((cp: string) => {
                this.cpBuscando[index] = true;
                this.cpError[index] = '';
                this.limpiarCamposCP(index);
                this.cdr.markForCheck();
                return this.catalogoService.getByCodigoPostal(cp).pipe(
                    takeUntil(this.destroy$)
                );
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (respuesta: any) => {
                this.cpBuscando[index] = false;

                if (!respuesta?.object) {
                    this.cpError[index] = 'Código postal no encontrado.';
                    this.cdr.markForCheck();
                    return;
                }

                const data = respuesta.object; 
                const dir = this.getDireccionGroup(index);

              
                dir.get('pais')?.setValue(data.pais?.nombre ?? '');
                dir.get('estado')?.setValue(data.estado?.nombre ?? '');
                dir.get('municipio')?.setValue(data.municipio?.nombre ?? '');

                const colonias: ColoniaModel[] = data.colonias ?? [];
                dir.get('_colonias')?.setValue(colonias);
                dir.get('idColonia')?.enable();
                dir.get('idColonia')?.setValue(null);

                if (colonias.length === 1) {
                    dir.get('idColonia')?.setValue(colonias[0].idColonia);
                }

                this.cdr.markForCheck();
            },
            error: () => {
                this.cpBuscando[index] = false;
                this.cpError[index] = 'Error al consultar el código postal.';
                this.limpiarCamposCP(index);
                this.cdr.markForCheck();
            }
        });
    }

    private limpiarCamposCP(index: number): void {
        const dir = this.getDireccionGroup(index);
        dir.get('pais')?.setValue('');
        dir.get('estado')?.setValue('');
        dir.get('municipio')?.setValue('');
        dir.get('_colonias')?.setValue([]);
        dir.get('idColonia')?.setValue(null);
        dir.get('idColonia')?.disable();
    }

    getRoles(): void {
        this.catalogoService.getRoles()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (r) => {
                    this.roles = r.objects || [];
                    this.cargando = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.mensajeError = 'Error al obtener los roles.';
                    this.cargando = false;
                    this.cdr.markForCheck();
                }
            });
    }

    // ─── Submit ───────────────────────────────────────────────────────────────
    public enviarDatos(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const fv = this.form.getRawValue(); // getRawValue incluye campos disabled
        const rolSeleccionado = this.roles.find(r => r.idRol === +fv.idRol)!;

        const direcciones: DireccionModel[] = fv.direcciones.map((d: any, i: number) => {
            const coloniaSeleccionada = this.getColoniasDir(i).find(c => c.idColonia === +d.idColonia)!;
            return {
                calle: d.calle,
                numeroExterior: d.numeroExterior,
                numeroInterior: d.numeroInterior || undefined,
                colonia: coloniaSeleccionada
            } as DireccionModel;
        });

        this.usuario = {
            idUsuario: 0,
            nombre: fv.nombre,
            apellidoPaterno: fv.apellidoPaterno,
            apellidoMaterno: fv.apellidoMaterno,
            celular: fv.celular,
            curp: fv.curp,
            userName: fv.userName,
            email: fv.email,
            password: fv.password,
            sexo: fv.sexo,
            telefono: fv.telefono,
            fechaNacimiento: fv.fechaNacimiento,
            estatus: fv.estatus,
            imagen: fv.imagen,
            rol: rolSeleccionado,
            direcciones
        };

        this.usuarioService.addUsuario(this.usuario)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuesta) => {
                    if (respuesta.correct) {
                        console.log('Usuario creado:', respuesta.object);
                    } else {
                        this.mensajeError = respuesta.errorMessage || 'Error desconocido.';
                        this.cdr.markForCheck();
                    }
                },
                error: () => {
                    this.mensajeError = 'Error de conexión.';
                    this.cdr.markForCheck();
                }
            });
    }

    isInvalid(campo: string): boolean {
        const c = this.form.get(campo);
        return !!(c?.invalid && c?.touched);
    }

    isInvalidDir(i: number, campo: string): boolean {
        const c = this.getDireccionGroup(i).get(campo);
        return !!(c?.invalid && c?.touched);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}