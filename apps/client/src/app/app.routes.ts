import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./fleet/fleet.component').then(
        (component) => component.FleetComponent,
      ),
  },
  {
    path: 'links/new',
    loadComponent: () =>
      import('./fleet/link-create/link-create.component').then(
        (component) => component.LinkCreateComponent,
      ),
  },
  {
    path: 'links/:id',
    loadComponent: () =>
      import('./fleet/link-detail/link-detail.component').then(
        (component) => component.LinkDetailComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
