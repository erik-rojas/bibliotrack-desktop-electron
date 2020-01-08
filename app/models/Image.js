const Image = (sequelize: any, DataTypes: any) => sequelize.define('images', {
  data: {
    type: DataTypes.BLOB('medium'),
    allowNull: false,
    get() {
      return this.getDataValue('data');
    },
    set(value) {
      this.setDataValue('data', value);
    }
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
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

export default Image;
