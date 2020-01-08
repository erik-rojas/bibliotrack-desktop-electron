const EbayCategory = (sequelize: any, DataTypes: any) => sequelize.define('ebay_category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('name');
    },
    set(value) {
      this.setDataValue('name', value);
    }
  },
  ebay_id: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('ebay_id');
    },
    set(value) {
      this.setDataValue('ebay_id', value);
    }
  }
}, {
  underscored: true
});

export default EbayCategory;
