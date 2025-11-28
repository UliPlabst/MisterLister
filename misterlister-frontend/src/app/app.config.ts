import { ApplicationConfig, ErrorHandler, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideRouter, Routes } from '@angular/router';
import { EnsureUserGuard } from './guards/EnsureUserGuard';
import { HomeComponent } from './pages/home/home.component';
import { ListComponent } from './pages/list/list.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { ImprintComponent } from './pages/imprint/imprint.component';
import { detectLocaleFromTimezone, lazyLoadLocale } from './utils/locale';
import { LOCALE } from './constants';
import { CustomErrorHandler } from './services/error-handler';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AboutComponent } from './pages/about/about.component';
import { ThirdPartyComponent } from './pages/third-party/third-party.component';

const routes: Routes = [
  { 
    path: "",
    component: HomeComponent
  },
  { 
    path: "privacy",
    component: PrivacyComponent
  },
  { 
    path: "imprint",
    component: ImprintComponent
  },
  { 
    path: "about",
    component: AboutComponent
  },
  { 
    path: "third-party",
    component: ThirdPartyComponent
  },
  { 
    path: "list/:id",
    component: ListComponent,
    canActivate: [
      EnsureUserGuard
    ]
  }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    {
      provide: LOCALE_ID,
      useFactory: () => LOCALE
    },
    {
      provide: ErrorHandler,
      useClass: CustomErrorHandler
    },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        floatLabel: "always",
        appearance: "outline"
      }
    },
    provideAnimations()
  ]
};

