const AmazonChannel = (sequelize: any, DataTypes: any) => sequelize.define('amazon_channel', {
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
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('url');
    },
    set(value) {
      this.setDataValue('url', value);
    }
  }
}, {
  underscored: true
});

export default AmazonChannel;
