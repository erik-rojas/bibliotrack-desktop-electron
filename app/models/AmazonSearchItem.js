const AmazonSearchItem = (sequelize: any, DataTypes: any) => sequelize.define('amazon_search_item', {
  isbn_asin: {
    type: DataTypes.STRING(13),
    allowNull: false,
    get() {
      return this.getDataValue('isbn_asin');
    },
    set(value) {
      this.setDataValue('isbn_asin', value);
    }
  }
}, {
  underscored: true
});

export default AmazonSearchItem;
