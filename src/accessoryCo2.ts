import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { fetchMetric } from './utils.js';
import { PiHomeHomebridgePlatform as PiHomeHomebridgePlatform } from './platform.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PiHomePlatformAccessoryCo2 {
  private tempService: Service;
  private humidityService: Service;
  private airQualityService: Service;
  private switchService: Service;
  private url: string;
  private dsId: number;
  private displayStatus: bool = false;


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

		this.switchService = this.accessory.getService(this.platform.Service.Switch)
			|| this.accessory.addService(this.platform.Service.Switch, 'Display Switch', 'switch');


		// Set Service names
		this.airQualityService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.air.displayName);
		this.tempService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.temp.displayName);
		this.humidityService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.humidity.displayName);
		this.switchService.setCharacteristic(this.platform.Characteristic.Name, 'Display Switch');

		// Map characteristics
		this.airQualityService.getCharacteristic(this.platform.Characteristic.AirQuality)
		  .onGet(this.handleAirQualityGet.bind(this));

		this.tempService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
		  .onGet(this.handleTemperatureGet.bind(this));

		this.humidityService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
		  .onGet(this.handleHumidityGet.bind(this));

		this.switchService.getCharacteristic(this.platform.Characteristic.On)
		  .onGet(this.handleDisplayGet.bind(this))
		  .onSet(this.handleDisplaySet.bind(this));
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
    const timeseries = await fetchMetric(this.url, this.dsId, 'co2', this.platform.log);

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
    const timeseries = await fetchMetric(this.url, this.dsId, 'temperature', this.platform.log);

    const lastTemperature = timeseries?.Value || 0;

    this.platform.log.debug('Get Temperature ->', lastTemperature);
    return lastTemperature;
  }

  async handleHumidityGet(): Promise<CharacteristicValue> {
    const timeseries = await fetchMetric(this.url, this.dsId, 'humidity', this.platform.log);

    const lastHumidity = timeseries?.Value || 0;

    this.platform.log.debug('Get Humidity->', lastHumidity);
    return lastHumidity;
  }

  async handleDisplayGet(): Promise<CharacteristicValue> {
    const timeseries = await fetchMetric(this.url, this.dsId, 'display_status', this.platform.log);

    const displayStatusInt = timeseries?.Value || 0;
    const displayStatus = Boolean(displayStatusInt);
    this.displayStatus = displayStatus;

    this.platform.log.debug('Get Display Status->', displayStatus);
    return displayStatus;
  }

  async triggerTcpCommand(command: string) {
    try {
      const result = await fetch(this.url + `/api/bridge/datasources/${this.dsId}/cmd/${command}`);

      if (!result.ok) {
        this.platform.log.error(`Error triggering tcp command: ${result}`);
      }

      const response = await result.text();

      this.platform.log.info(`Successfully triggered tcp command: ${response}`);
    } catch (e) {
      this.platform.log.error('Error while triggering tcp command', e);
    }
  }

  async handleDisplayStatsuSet() {
    if (this.displayStatus) {
      // Turn off display
      await this.triggerTcpCommand('command_co2_display_off');
    } else {
      // Turn on display
      await this.triggerTcpCommand('command_co2_display_on');
    }
  }
}
