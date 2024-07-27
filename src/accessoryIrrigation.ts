import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { PiHomeHomebridgePlatform as PiHomeHomebridgePlatform } from './platform.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class PiHomePlatformAccessoryIrrigation {
	private moistureService: Service;

	constructor(
		private readonly platform: PiHomeHomebridgePlatform,
		private readonly accessory: PlatformAccessory,
	) {
		this.platform.log.debug("Registering irrigation accessory")

		// set accessory information
		this.accessory.getService(this.platform.Service.AccessoryInformation)!
			.setCharacteristic(this.platform.Characteristic.Manufacturer, 'Hofmania')
			.setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.dsType)
			.setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.dsId);

		// Init services
		this.moistureService = this.accessory.getService(this.platform.Service.AirQualitySensor)
			|| this.accessory.addService(this.platform.Service.AirQualitySensor, "Air Quality Sensor", "airquality")

		// Set Service names
		this.moistureService.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.moisture.displayName);

		// Map characteristics
		this.moistureService.getCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity)
			.onGet(this.handleMoistureGet.bind(this))
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
		// TODO: Implement fetch to home server
		const moisture = 21.3
		this.platform.log.debug('Get Moisture ->', moisture);
		return moisture;
	}
}
