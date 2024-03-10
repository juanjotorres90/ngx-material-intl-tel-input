import { CountryISO } from '../enums/country-iso.enum';

export type Country = {
  name: string;
  iso2: CountryISO | string;
  dialCode: string;
  priority: number;
  areaCodes?: string[];
  htmlId: string;
  flagClass: string;
  placeHolder: string;
};
