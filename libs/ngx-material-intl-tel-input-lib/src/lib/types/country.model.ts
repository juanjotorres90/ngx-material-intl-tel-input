import { CountryISO } from '../enums/country-iso.enum';

export type Country = {
  emojiFlag: string;
  name: string;
  iso2: CountryISO | string;
  dialCode: string;
  priority: number;
  areaCodes?: string[];
  htmlId: string;
  flagClass: string;
  placeHolder: string;
  mask?: {
    mask: string;
    lazy?: boolean;
  };
};
