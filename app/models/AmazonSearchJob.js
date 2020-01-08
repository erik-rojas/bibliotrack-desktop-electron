const AmazonSearchJob = (sequelize: any, DataTypes: any) => sequelize.define('amazon_search_job', {
  isbn_asin: {
    type: DataTypes.STRING(13),
    allowNull: false,
    get() {
      return this.getDataValue('isbn_asin');
    },
    set(value) {
      this.setDataValue('isbn_asin', value);
    }
  },
  // 0 = in queue
  // 1 = success
  // 2 = failed
  status: {
    type: DataTypes.INTEGER(1).UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('status');
    },
    set(value) {
      this.setDataValue('status', value);
    }
  },
  // https://docs.aws.amazon.com/AWSECommerceService/latest/DG/ErrorMessages.html
  status_code: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      return this.getDataValue('status_code');
    },
    set(value) {
      this.setDataValue('status_code', value);
    }
  }
}, {
  underscored: true
});

export default AmazonSearchJob;
