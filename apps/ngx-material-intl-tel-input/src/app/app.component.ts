import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';

@Component({
  standalone: true,
  imports: [NgxMaterialIntlTelInputComponent, RouterModule],
  selector: 'ngx-material-intl-tel-input-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'ngx-material-intl-tel-input';
  currentPhoneValue = signal<string>('');

  getValue(value: string): void {
    this.currentPhoneValue.set(value);
  }
}
