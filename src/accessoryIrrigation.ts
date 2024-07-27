import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { PiHomeHomebridgePlatform as PiHomeHomebridgePlatform } from './platform.js';
import { IMetric } from './accessoryCo2.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PiHomePlatformAccessoryIrrigation {
  private moistureService: Service;
  private url: string;
  private dsId: number;


  constructor(
		private readonly platform: PiHomeHomebridgePlatform,
		private readonly accessory: PlatformAccessory,
  ) {
    this.url = accessory.context.url;
    this.dsId = accessory.context.device.dsId;

		// set accessory information
		this.accessory.getService(this.platform.Service.AccessoryInformation)!
		  .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Hofmania')
		  .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.dsType)
		  .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.uuid);

		// Init services
		this.moistureService = this.accessory.getService(this.platform.Service.HumiditySensor)
			|| this.accessory.addService(this.platform.Service.HumiditySensor, 'Air Quality Sensor', 'airquality');

		// Set Service names
		this.moistureService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.moisture.displayName);

		// Map characteristics
		this.moistureService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
		  .onGet(this.handleMoistureGet.bind(this));
  }

  async fetchMetric(metric: string): Promise<IMetric | null> {
    const res = await fetch(this.url + `/api/bridge/datasources/${this.dsId}/${metric}`);

    if (!res.ok) {
      this.platform.log.error(`Error fetching metric from remote: ${res}`);
      return null;
    }

    const timeseries: IMetric = await res.json();

    return timeseries;
  }

  /**
	 * Handle the "GET" requests from HomeKit
	 * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
	 *
	 * GET requests should return as fast as possible. A long delay here will result in
	 * HomeKit being unresponsive and a bad user experience in general.
	 *
	 * If your device takes time to respond you should update the status of your device
	 * asynchronously instead using the `updateCharacteristic` method instead.

	 * @example
	 * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
	 */
  async handleMoistureGet(): Promise<CharacteristicValue> {
    const timeseries = await this.fetchMetric('moisture');

    const lastMoistureInt = timeseries?.Value || 5000;
    const lastMoisture = lastMoistureInt / 100;

    this.platform.log.debug('Get Humidity->', lastMoisture);
    return lastMoisture;

  }
}
