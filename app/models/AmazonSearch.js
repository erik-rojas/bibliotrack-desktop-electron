const AmazonSearch = (sequelize: any, DataTypes: any) => sequelize.define('amazon_search', {
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
  is_asin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    get() {
      return this.getDataValue('is_asin');
    },
    set(value) {
      this.setDataValue('is_asin', value);
    }
  },
  searched_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('searched_count');
    },
    set(value) {
      this.setDataValue('searched_count', value);
    }
  },
  searched_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('searched_at');
    },
    set(value) {
      this.setDataValue('searched_at', value);
    }
  }
}, {
  underscored: true
});

export default AmazonSearch;
