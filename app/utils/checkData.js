// @flow
const checkData = (data: any, defaultValue: any = '') => ((data !== null) && (data !== undefined) ? data : defaultValue);

export default checkData;
