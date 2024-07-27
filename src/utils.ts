import { Logging } from 'homebridge';

export interface IMetric {
	Value: number;
	Timestamp: string;
}


export const fetchMetric = async (url: string, dsId: number, metric: string, log: Logging): Promise<IMetric | null> => {
  try {
    const res = await fetch(url + `/api/bridge/datasources/${dsId}/${metric}`);

    if (!res.ok) {
      log.error(`Error fetching metric from remote: ${res}`);
      return null;
    }

    const timeseries: IMetric = await res.json();

    return timeseries;
  } catch (e) {
    log.error('Error fetching timeseries: ', e);
    return null;
  }
};

