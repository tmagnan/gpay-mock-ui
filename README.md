# GooglePayPush

# running to generate sessionIds

1. `ng build`
2. `ng serve`
3. go to `http://localhost:3000/`
4. select add card
5. log into google account matching the flow for gpay
6. before continuing right click and inspect the page
7. go to the console page 
8. continue through the flow until the "waiting on the issuer" page where you will see sessionIds returned
9. copy values out of the application and paste into postman, sam or karate



This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.2.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
