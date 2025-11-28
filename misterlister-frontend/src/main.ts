import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import { detectLocaleFromTimezone, lazyLoadLocale } from './app/utils/locale';
import { LOCALE } from './app/constants';

init();
async function init()
{
  const locale = LOCALE;
  await lazyLoadLocale(locale);
  try
  {
    await bootstrapApplication(AppComponent, appConfig)
  }
  catch(err)
  {
    console.error(err);
  }
}