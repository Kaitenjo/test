import { bootstrapApplication } from '@angular/platform-browser';
// Defines xd-grid and, through its template imports, every component and directive it uses
import '@xaendar/ui-kit/xd-grid/xd-grid.xd.component';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((error: unknown) => console.error(error));
