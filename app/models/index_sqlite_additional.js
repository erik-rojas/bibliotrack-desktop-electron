// @flow
import { Sequelize } from 'sequelize';

import AmazonDataAdditional from './AmazonDataAdditional';

import EbayDataCompletedAdditional from './EbayDataCompletedAdditional';

const ModelsSqliteAdditional = (sequelize: any = null) => {
  if (sequelize === null) return null;

  return {
    sequelize: sequelize,
    AmazonData: AmazonDataAdditional(sequelize, Sequelize),
    EbayDataCompleted: EbayDataCompletedAdditional(sequelize, Sequelize)
  };
};

export default ModelsSqliteAdditional;
