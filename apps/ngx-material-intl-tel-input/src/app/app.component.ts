import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';

@Component({
  standalone: true,
  imports: [NgxMaterialIntlTelInputComponent, RouterModule],
  selector: 'ngx-material-intl-tel-input-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ngx-material-intl-tel-input';
}
