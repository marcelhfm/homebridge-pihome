
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { PiHomeHomebridgePlatform as PiHomeHomebridgePlatform } from './platform.js';

export interface IMetric {
	Value: number;
	Timestamp: string;
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PiHomePlatformAccessoryCo2 {
  private tempService: Service;
  private humidityService: Service;
  private airQualityService: Service;
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
		this.airQualityService = this.accessory.getService(this.platform.Service.AirQualitySensor)
			|| this.accessory.addService(this.platform.Service.AirQualitySensor, 'Air Quality Sensor', 'airquality');

		this.tempService = this.accessory.getService(this.platform.Service.TemperatureSensor)
			|| this.accessory.addService(this.platform.Service.TemperatureSensor, 'Temperature Sensor', 'temperature');

		this.humidityService = this.accessory.getService(this.platform.Service.HumiditySensor)
			|| this.accessory.addService(this.platform.Service.HumiditySensor, 'Humidity Sensor', 'humidity');


		// Set Service names
		this.airQualityService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.air.displayName);
		this.tempService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.temp.displayName);
		this.humidityService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.humidity.displayName);

		// Map characteristics
		this.airQualityService.getCharacteristic(this.platform.Characteristic.AirQuality)
		  .onGet(this.handleAirQualityGet.bind(this));

		this.tempService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
		  .onGet(this.handleTemperatureGet.bind(this));

		this.humidityService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
		  .onGet(this.handleHumidityGet.bind(this));
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
  async handleAirQualityGet(): Promise<CharacteristicValue> {
    const timeseries = await this.fetchMetric('co2');

    const lastCo2: number = timeseries?.Value || 0;

    let airQuality;
    if (lastCo2 === 0) {
      airQuality = this.platform.Characteristic.AirQuality.UNKNOWN;
    } else if (lastCo2 >= 1500) {
      airQuality = this.platform.Characteristic.AirQuality.POOR;
    } else if (lastCo2 >= 1200) {
      airQuality = this.platform.Characteristic.AirQuality.INFERIOR;
    } else if (lastCo2 >= 1000) {
      airQuality = this.platform.Characteristic.AirQuality.FAIR;
    } else if (lastCo2 >= 800) {
      airQuality = this.platform.Characteristic.AirQuality.GOOD;
    } else {
      airQuality = this.platform.Characteristic.AirQuality.EXCELLENT;
    }

    this.platform.log.debug(`Get Airquality -> Co2: ${lastCo2} -> ${airQuality}`);
    return airQuality;
  }

  async handleTemperatureGet(): Promise<CharacteristicValue> {
    const timeseries = await this.fetchMetric('temperature');

    const lastTemperature = timeseries?.Value || 0;

    this.platform.log.debug('Get Temperature ->', lastTemperature);
    return lastTemperature;
  }

  async handleHumidityGet(): Promise<CharacteristicValue> {
    const timeseries = await this.fetchMetric('humidity');

    const lastHumidity = timeseries?.Value || 0;

    this.platform.log.debug('Get Humidity->', lastHumidity);
    return lastHumidity;
  }
}
