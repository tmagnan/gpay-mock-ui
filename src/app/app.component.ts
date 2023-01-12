import { Component } from '@angular/core';
import { UtilsService } from 'src/services/utils.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(private utils: UtilsService) {}

  link() {
    console.debug("Start flow");
    this.utils.openAppWindow();
  }
}
