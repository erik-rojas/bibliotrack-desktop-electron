// @flow
const getDefaults = (channelName: string = 'amazon.it', field: string = 'language') => {
  if (field === 'language') {
    switch (channelName) {
      case 'amazon.de':
        return 'Deutsch';
      case 'amazon.it':
        return 'Italiano';
      case 'amazon.fr':
        return 'Français';
      case 'amazon.es':
        return 'Español';
      case 'amazon.co.uk':
      case 'amazon.com':
      default:
        return 'English';
    }
  } else if (field === 'currency') {
    switch (channelName) {
      case 'amazon.co.uk':
        return 'GBP';
      case 'amazon.de':
      case 'amazon.it':
      case 'amazon.fr':
      case 'amazon.es':
        return 'EUR';
      case 'amazon.com':
      default:
        return 'USD';
    }
  }
};

export default getDefaults;
