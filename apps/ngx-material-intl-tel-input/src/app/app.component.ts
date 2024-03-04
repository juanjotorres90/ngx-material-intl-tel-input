import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxMaterialIntlTelInputLibComponent } from 'ngx-material-intl-tel-input';

@Component({
  standalone: true,
  imports: [NgxMaterialIntlTelInputLibComponent, RouterModule],
  selector: 'ngx-material-intl-tel-input-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ngx-material-intl-tel-input';
}
