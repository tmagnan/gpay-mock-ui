import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class UtilsService {
    openAppWindow() {
        (window as any).googlepay.openAppWindow({
            integratorId: 'CAPITALONE_1',
            isTestEnvironment: true,
            tokenSetting: 1,
            cardSetting: 1,
            hl: 'en-US',
            onReady: () => {
                console.debug("ready hook fired");
            },
            onSessionCreated: (payload: any) => {
                console.debug("session created hook fired", payload);
            }
        });
    }
}