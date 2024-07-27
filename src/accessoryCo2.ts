
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

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

	/**
	 * These are just used to create a working example
	 * You should implement your own code to track the state of your accessory
	 */
	private co2State = {
		DisplayOn: false,
	};

	constructor(
		private readonly platform: PiHomeHomebridgePlatform,
		private readonly accessory: PlatformAccessory,
	) {
		this.platform.log.debug("Registering co2 accessory")

		// set accessory information
		this.accessory.getService(this.platform.Service.AccessoryInformation)!
			.setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
			.setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
			.setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

		// Init services
		this.airQualityService = this.accessory.getService(this.platform.Service.AirQualitySensor)
			|| this.accessory.addService(this.platform.Service.AirQualitySensor, "Air Quality Sensor", "airquality")

		this.tempService = this.accessory.getService(this.platform.Service.TemperatureSensor)
			|| this.accessory.addService(this.platform.Service.TemperatureSensor, "Temperature Sensor", "temperature")

		this.humidityService = this.accessory.getService(this.platform.Service.HumiditySensor)
			|| this.accessory.addService(this.platform.Service.HumiditySensor, "Humidity Sensor", "humidity")


		// Set Service names
		this.airQualityService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.air.displayName);
		this.tempService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.temp.displayName);
		this.humidityService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.humidity.displayName);

		// Map characteristics
		this.airQualityService.getCharacteristic(this.platform.Characteristic.AirQuality)
			.onGet(this.handleAirQualityGet.bind(this))

		this.tempService.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
			.onGet(this.handleTemperatureGet.bind(this))

		this.humidityService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
			.onGet(this.handleHumidityGet.bind(this))
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
		// TODO: Implement fetch to home server
		const airQuality = this.platform.Characteristic.AirQuality.UNKNOWN;
		this.platform.log.debug('Get Airquality ->', airQuality);
		return airQuality;
	}

	async handleTemperatureGet(): Promise<CharacteristicValue> {
		// TODO: Implement fetch to home server
		const temperature = 0;
		this.platform.log.debug('Get Temperature ->', temperature);
		return temperature;
	}

	async handleHumidityGet(): Promise<CharacteristicValue> {
		// TODO: Implement fetch to home server
		const humidity = 0;
		this.platform.log.debug('Get Humidity ->', humidity)
		return humidity;
	}
}
