import { Routes } from '@angular/router';
import { UsuarioComponent } from './Components/usuario-component/usuario.component';
import { UsuarioDetailComponent } from './Components/usuario-detail-component/usuario.detail.component';
import { FormComponent } from './Components/usuario-form-component/usuario.form.component';

export const API_BASE_URL = 'http://localhost:8081/api';
export const API_ROUTES = {
    catalogos: {
        rol: `${API_BASE_URL}/rol`,
        pais: `${API_BASE_URL}/pais`,
        estado: `${API_BASE_URL}/estado/:idPais`,
        municipio: `${API_BASE_URL}/municipio/:idEstado`,
        colonia: `${API_BASE_URL}/colonia/:idMunicipio`
    },
    usuario: {
        base: `${API_BASE_URL}/usuario`,
        cambioStatus: `${API_BASE_URL}/usuario/cambioStatus/:id/`
    }
};




export const routes: Routes = [
    { path: '', component: UsuarioComponent },
    { path: 'usuario/:id', component: UsuarioDetailComponent },
    { path: 'form', component: FormComponent }

];
