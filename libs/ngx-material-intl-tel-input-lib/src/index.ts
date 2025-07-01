// Main component (new restructured version)
export { NgxMaterialIntlTelInputRefactoredComponent } from './lib/components/ngx-material-intl-tel-input/ngx-material-intl-tel-input.component';

// Legacy component (for backward compatibility)
export * from './lib/ngx-material-intl-tel-input-lib/ngx-material-intl-tel-input-lib.component';

// Sub-components (for advanced usage)
export * from './lib/components/country-selector/country-selector.component';
export * from './lib/components/phone-number-input/phone-number-input.component';
export * from './lib/components/validation-messages/validation-messages.component';

// Services
export * from './lib/services/phone-input-facade/phone-input-facade.service';
export * from './lib/services/country-data/country-data.service';
export * from './lib/services/geo-ip/geo-ip.service';

// Types and Enums
export * from './lib/types/text-labels.type';
export * from './lib/types/country.model';
export * from './lib/types/geo.type';
export * from './lib/enums/country-iso.enum';

// Validators and Utilities
export * from './lib/validators/tel.validators';
export * from './lib/utils/phone-number.utils';
