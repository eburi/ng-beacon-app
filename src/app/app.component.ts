import {Component, ChangeDetectorRef} from '@angular/core';

import {NgBeaconService} from './ng-beacon.service';
import {BluetoothUtilsService} from './bluetooth-utils.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  connecting = false;
  connected = false;
  beaconVersion = '';
  batteryVoltage = 0;
  beaconUptime: number = null;
  beaconName = 'ng-beacon';
  beaconUrl = 'ngbeacon.io';
  debugLog = '';

  constructor(private ngBeacon: NgBeaconService,
              private bluetoothUtils: BluetoothUtilsService,
              private cdRef: ChangeDetectorRef) {
  }

  async connect() {
    this.connecting = true;
    this.beaconVersion = '';
    this.batteryVoltage = 0;
    this.beaconUptime = null;
    try {
      await this.ngBeacon.connect();
      this.connected = true;
      this.ngBeacon.uart.receive$.subscribe(value => {
        this.debugLog += value;
        this.cdRef.detectChanges();
      });
      this.ngBeacon.uart.lines$.subscribe(line => {
        if (line.startsWith('["~$",')) {
          const [_, battery, uptime, version] = JSON.parse(line);
          this.beaconVersion = version;
          this.batteryVoltage = battery;
          this.beaconUptime = uptime;
        }
        this.cdRef.detectChanges();
      });
      this.ngBeacon.uart.sendText(`\nprint(JSON.stringify(['~$',NRF.getBattery(),getTime()|0,process.env.VERSION]))\n`);
    } finally {
      this.connecting = false;
    }
  }

  disconnect() {
    this.ngBeacon.disconnect();
    this.clearLog();
    this.connected = false;
  }

  clearLog() {
    this.debugLog = '';
  }

  reset() {
    this.ngBeacon.uart.sendText('\nreset()\n');
  }

  get deviceName() {
    return this.ngBeacon.deviceName;
  }

  uploadEddystone() {
    this.ngBeacon.uploadEddystone({name: this.beaconName}, this.beaconUrl);
  }

  uploadTemperature() {
    this.ngBeacon.uploadTemperature({name: this.beaconName});
  }

  uploadIBeacon() {
    this.ngBeacon.uploadIBeacon({name: this.beaconName});
  }

  readTemperature() {
    this.ngBeacon.uart.sendText(`ngbeacon.temperature()\n ngbeacon.humidity()\n`);
  }

  onKeyCmdInput(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13:
        const inputField = <HTMLInputElement>event.target;
        this.ngBeacon.uart.sendText(`${inputField.value}\n`);
        inputField.value = '';
        break;
      default:
    }
  }
}
