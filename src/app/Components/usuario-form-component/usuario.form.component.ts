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
import { PaisModel } from "../../Interfaces/Catalogos/PaisModel";
import { EstadoModel } from "../../Interfaces/Catalogos/EstadoModel";
import { MunicipioModel } from "../../Interfaces/Catalogos/MunicipioModel";
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
    paises: PaisModel[] = []; // Guardaremos los países a nivel global
    mensajeError: string = '';
    cargando: boolean = true;

    cpBuscando: boolean[] = [false];
    cpError: string[] = [''];

    // Variable para guardar la URL de previsualización de la imagen
    imagenPreviewUrl: string | ArrayBuffer | null = null;

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
        imagen: [''], // Este control guardará la imagen en base64
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
            idPais: [null, Validators.required],
            idEstado: [{ value: null, disabled: true }, Validators.required],
            idMunicipio: [{ value: null, disabled: true }, Validators.required],
            idColonia: [{ value: null, disabled: true }, Validators.required],
            // Arrays ocultos para guardar la data de la cascada de esta dirección en particular
            _estados: [[]],
            _municipios: [[]],
            _colonias: [[]]
        });
    }

    get direccionesArray(): FormArray {
        return this.form.get('direcciones') as FormArray;
    }

    getDireccionGroup(i: number): FormGroup {
        return this.direccionesArray.at(i) as FormGroup;
    }

    // Funciones Helper para obtener las listas en el HTML
    getEstadosDir(i: number): EstadoModel[] { return this.getDireccionGroup(i).get('_estados')?.value || []; }
    getMunicipiosDir(i: number): MunicipioModel[] { return this.getDireccionGroup(i).get('_municipios')?.value || []; }
    getColoniasDir(i: number): ColoniaModel[] { return this.getDireccionGroup(i).get('_colonias')?.value || []; }

    ngOnInit(): void {
        this.getRoles();
        this.getPaises();
        this.suscribirEventosDireccion(0); 
    }

    getPaises(): void {
        this.catalogoService.getPaises().pipe(takeUntil(this.destroy$)).subscribe(res => {
            if (res.objects) {
                this.paises = res.objects;
                this.cdr.markForCheck();
            }
        });
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

    // Función para manejar el cambio en el input de archivo
    onFileChange(event: any): void {
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = () => {
                // Actualizamos la URL de previsualización y el valor del control 'imagen'
                this.imagenPreviewUrl = reader.result;
                this.form.get('imagen')?.setValue(reader.result as string);
                this.cdr.markForCheck(); // Forzamos la detección de cambios
            };

            reader.readAsDataURL(file); // Leemos el archivo como Data URL (base64)
        } else {
            // Si no se seleccionó archivo, limpiamos la previsualización y el control
            this.imagenPreviewUrl = null;
            this.form.get('imagen')?.setValue('');
            this.cdr.markForCheck();
        }
    }

    private suscribirEventosDireccion(index: number): void {
        const dir = this.getDireccionGroup(index);

        // 1. FLUJO A: Cuando el usuario escribe el Código Postal
        dir.get('codigoPostal')!.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            filter((cp: string) => /^\d{5}$/.test(cp)),
            switchMap((cp: string) => {
                this.cpBuscando[index] = true;
                this.cpError[index] = '';
                this.cdr.markForCheck();
                return this.catalogoService.getByCodigoPostal(cp).pipe(takeUntil(this.destroy$));
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
                const colonias: ColoniaModel[] = data.colonias ?? [];

                // Alimentamos los catálogos internos con los objetos devueltos para que el <select> los pueda mostrar
                dir.get('_estados')?.setValue(data.estado ? [data.estado] : []);
                dir.get('_municipios')?.setValue(data.municipio ? [data.municipio] : []);
                dir.get('_colonias')?.setValue(colonias);

                // Habilitamos los controles
                dir.get('idEstado')?.enable({ emitEvent: false });
                dir.get('idMunicipio')?.enable({ emitEvent: false });
                dir.get('idColonia')?.enable({ emitEvent: false });

                // Hacemos un "patchValue" con {emitEvent: false} para que NO se dispare el "FLUJO B" por accidente
                dir.patchValue({
                    idPais: data.pais?.idPais || null,
                    idEstado: data.estado?.idEstado || null,
                    idMunicipio: data.municipio?.idMunicipio || null,
                    idColonia: colonias.length === 1 ? colonias[0].idColonia : null
                }, { emitEvent: false });

                this.cdr.markForCheck();
            },
            error: () => {
                this.cpBuscando[index] = false;
                this.cpError[index] = 'Error al consultar el código postal.';
                this.cdr.markForCheck();
            }
        });

        // 2. FLUJO B: Cascada hacia abajo (País -> Estado -> Municipio -> Colonia -> CP)
        
        // Cambio de País -> Cargar Estados
        dir.get('idPais')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idPais => {
            if (!idPais) return;
            dir.patchValue({ idEstado: null, idMunicipio: null, idColonia: null, codigoPostal: '' }, { emitEvent: false });
            dir.get('idEstado')?.disable({ emitEvent: false });
            dir.get('idMunicipio')?.disable({ emitEvent: false });
            dir.get('idColonia')?.disable({ emitEvent: false });
            dir.get('_estados')?.setValue([]);

            this.catalogoService.getEstados(idPais).pipe(takeUntil(this.destroy$)).subscribe(res => {
                dir.get('_estados')?.setValue(res.objects || []);
                dir.get('idEstado')?.enable({ emitEvent: false });
                this.cdr.markForCheck();
            });
        });

        // Cambio de Estado -> Cargar Municipios
        dir.get('idEstado')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idEstado => {
            if (!idEstado) return;
            dir.patchValue({ idMunicipio: null, idColonia: null, codigoPostal: '' }, { emitEvent: false });
            dir.get('idMunicipio')?.disable({ emitEvent: false });
            dir.get('idColonia')?.disable({ emitEvent: false });
            dir.get('_municipios')?.setValue([]);

            this.catalogoService.getMunicipios(idEstado).pipe(takeUntil(this.destroy$)).subscribe(res => {
                dir.get('_municipios')?.setValue(res.objects || []);
                dir.get('idMunicipio')?.enable({ emitEvent: false });
                this.cdr.markForCheck();
            });
        });

        // Cambio de Municipio -> Cargar Colonias
        dir.get('idMunicipio')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idMunicipio => {
            if (!idMunicipio) return;
            dir.patchValue({ idColonia: null, codigoPostal: '' }, { emitEvent: false });
            dir.get('idColonia')?.disable({ emitEvent: false });
            dir.get('_colonias')?.setValue([]);

            this.catalogoService.getColonias(idMunicipio).pipe(takeUntil(this.destroy$)).subscribe(res => {
                dir.get('_colonias')?.setValue(res.objects || []);
                dir.get('idColonia')?.enable({ emitEvent: false });
                this.cdr.markForCheck();
            });
        });

        // Cambio de Colonia -> Autocompletar CP
        dir.get('idColonia')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idColonia => {
            if (!idColonia) return;
            const colonias = this.getColoniasDir(index);
            const coloniaSeleccionada = colonias.find(c => c.idColonia === idColonia);
            if (coloniaSeleccionada && coloniaSeleccionada.codigoPostal) {
                // Rellenamos el CP sin disparar el Flujo A de nuevo
                dir.get('codigoPostal')?.setValue(coloniaSeleccionada.codigoPostal, { emitEvent: false });
                this.cdr.markForCheck();
            }
        });
    }

    public enviarDatos(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const fv = this.form.getRawValue();
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
            imagen: fv.imagen, // Aquí se enviará la imagen en base64
            rol: rolSeleccionado,
            direcciones
        };

        this.usuarioService.addUsuario(this.usuario)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (respuesta) => {
                    if (respuesta.correct) {
                        console.log('Usuario creado:', respuesta.object);
                        // Aquí puedes redirigir o mostrar mensaje de éxito
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