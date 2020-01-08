// @flow
const isDomestic = (channelName: string, languageName: string) => {
  // const channelName: string
  //
  // amazon.co.uk
  // amazon.de
  // amazon.it
  // amazon.fr
  // amazon.es
  // amazon.com
  //
  //
  // const languageName: string
  //
  // English: Anglais, Englisch, Inglese, Inglés
  // Italian: Italiano, Italien, Italienisch
  // Spanish: Spanisch, Spagnolo, Español, Espagnol
  // French: Francés, Français, Francese, Französisch
  // German: Deutsch, Tedesco, Allemand, Alemán
  // Multilingual: Multilingue, Plurilingue, Mehrsprachig
  //
  const englishLanguageNames = [
    'English', 'Anglais', 'Englisch', 'Inglese', 'Inglés'
  ];

  const germanLanguageNames = [
    'German', 'Deutsch', 'Tedesco', 'Allemand', 'Alemán'
  ];

  const italianLanguageNames = [
    'Italian', 'Italiano', 'Italien', 'Italienisch'
  ];

  const frenchLanguageNames = [
    'French', 'Francés', 'Français', 'Francese', 'Französisch'
  ];

  const spanishLanguageNames = [
    'Spanish', 'Spanisch', 'Spagnolo', 'Español', 'Espagnol'
  ];

  switch (channelName) {
    case 'amazon.com':
    case 'amazon.co.uk':
      return englishLanguageNames.includes(languageName);
    case 'amazon.de':
      return germanLanguageNames.includes(languageName);
    case 'amazon.it':
      return italianLanguageNames.includes(languageName);
    case 'amazon.fr':
      return frenchLanguageNames.includes(languageName);
    case 'amazon.es':
      return spanishLanguageNames.includes(languageName);
    default:
      return false;
  }
};

export default isDomestic;
