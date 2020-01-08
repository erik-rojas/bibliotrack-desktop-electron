import * as amazon from 'amazon-product-api';

function check(id, type) {
  const client = amazon.createClient({
    awsId: 'AKIAJ2J4ROC4GYIWCMMQ',
    awsSecret: '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',
    awsTag: 'jo8th6-21'
  });

  return client.itemLookup({
    idType: type,
    itemId: id,
    responseGroup: 'ItemAttributes,Offers,SalesRank',
    domain: 'webservices.amazon.it'
  }).then(results => {
    console.log(results);
    return null;
  });
}

check(
  '9783836538305,9788811584001,9788815254276,9788815258335,9788815265654,9788816302518,9788816406810,9788814114595',
  'EAN'
);
