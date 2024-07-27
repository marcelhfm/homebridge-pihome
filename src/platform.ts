import { API, DynamicPlatformPlugin, Logging, PlatformAccessory, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { PiHomePlatformAccessoryCo2 } from './accessoryCo2.js';
import { PiHomePlatformAccessoryIrrigation } from './accessoryIrrigation.js';

interface PiHomeAccessoryContext {
	dsId: number,
	dsName: string,
	dsType: string,
	air?: {
		displayName: string
	},
	temp?: {
		displayName: string
	},
	humidity?: {
		displayName: string
	},
	moisture?: {
		displayName: string
	}
}

interface PiHomeConfig {
	name: string,
	pihomeApiUrl: string
}

interface DatasourcesResponse {
	Id: number,
	Name: string,
	Status: "CONNECTED" | "DISCONNECTED",
	Type: "CO2" | "IRRIGATION"
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class PiHomeHomebridgePlatform implements DynamicPlatformPlugin {
	public readonly Service: typeof Service;
	public readonly Characteristic: typeof Characteristic;

	// this is used to track restored cached accessories
	public readonly accessories: PlatformAccessory[] = [];

	constructor(
		public readonly log: Logging,
		public readonly config: PiHomeConfig,
		public readonly api: API,
	) {
		this.Service = api.hap.Service;
		this.Characteristic = api.hap.Characteristic;

		this.log.debug('Finished initializing platform:', this.config.name);

		this.api.on('didFinishLaunching', () => {
			log.debug('Executed didFinishLaunching callback');
			// run the method to discover / register your devices as accessories
			this.discoverDevices(this.config);
		});
	}

	/**
	 * This function is invoked when homebridge restores cached accessories from disk at startup.
	 * It should be used to set up event handlers for characteristics and update respective values.
	 */
	configureAccessory(accessory: PlatformAccessory) {
		this.log.info('Loading accessory from cache:', accessory.displayName);

		// add the restored accessory to the accessories cache, so we can track if it has already been registered
		this.accessories.push(accessory);
	}

	/**
	*		Calls Home Server API to discover available devices
	*
	**/
	async discoverDevices(config: PiHomeConfig) {
		// TODO: Fetch devices from home server
		const url = config.pihomeApiUrl

		const res = await fetch(url + "/api/bridge/datasources")

		if (!res.ok) {
			this.log.error(`Error fetching datasources from remote: ${res}`)
			return
		}

		const datasources: DatasourcesResponse[] = await res.json()

		this.log.info(`Fetched ${datasources.length} from remote.`)

		const devices: PiHomeAccessoryContext[] = datasources.map((ds: DatasourcesResponse) => ({
			dsId: ds.Id,
			dsName: ds.Name,
			dsType: ds.Type,
			air: {
				displayName: "Air quality"
			},
			temp: {
				displayName: "Temperature"
			},
			humidity: {
				displayName: "Humidity"
			},
			moisture: {
				displayName: "Plant Moisture Sensor"
			}

		}))

		// loop over the discovered devices and register each one if it has not already been registered
		for (const device of devices) {
			const uuid = this.api.hap.uuid.generate(String(device.dsId))

			// see if an accessory with the same uuid has already been registered and restored from
			// the cached devices we stored in the `configureAccessory` method above
			const existingAccessory: PlatformAccessory<any> | undefined
				= this.accessories.find(accessory => accessory.UUID === uuid);

			if (existingAccessory) {
				// the accessory already exists
				this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
				this.createAccessoryByType(existingAccessory, device.dsType)
			} else {
				// the accessory does not yet exist, so we need to create it
				this.log.info('Adding new accessory:', device.dsName);

				// create a new accessory
				const accessory = new this.api.platformAccessory(device.dsName, uuid);

				// store a copy of the device object in the `accessory.context`
				// the `context` property can be used to store any data about the accessory you may need
				accessory.context.device = device;

				this.createAccessoryByType(accessory, device.dsType)

				// link the accessory to your platform
				this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
			}
		}
	}

	createAccessoryByType(accessory: PlatformAccessory<any>, type: string) {
		if (type === "CO2") {
			new PiHomePlatformAccessoryCo2(this, accessory);
		} else if (type === "IRRIGATION") {
			new PiHomePlatformAccessoryIrrigation(this, accessory);
		} else {
			this.log.error("Unable to create accessory handler for unknown type ${type}", type)
		}
	}
}
