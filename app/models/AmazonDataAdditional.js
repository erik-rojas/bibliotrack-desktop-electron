const AmazonData = (sequelize: any, DataTypes: any) => sequelize.define('amazon_data', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('title');
    },
    set(value) {
      this.setDataValue('title', value);
    }
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('author');
    },
    set(value) {
      this.setDataValue('author', value);
    }
  },
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
  language: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('language');
    },
    set(value) {
      this.setDataValue('language', value);
    }
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('rank');
    },
    set(value) {
      this.setDataValue('rank', value);
    },
  },
  currency_code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    get() {
      return this.getDataValue('currency_code');
    },
    set(value) {
      this.setDataValue('currency_code', value);
    },
  },
  new_lowest_price: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    get() {
      return this.getDataValue('new_lowest_price');
    },
    set(value) {
      this.setDataValue('new_lowest_price', value);
    },
  },
  used_lowest_price: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    get() {
      return this.getDataValue('used_lowest_price');
    },
    set(value) {
      this.setDataValue('used_lowest_price', value);
    },
  },
  new_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('new_count');
    },
    set(value) {
      this.setDataValue('new_count', value);
    },
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('used_count');
    },
    set(value) {
      this.setDataValue('used_count', value);
    },
  },
  search_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('search_number');
    },
    set(value) {
      this.setDataValue('search_number', value);
    }
  },
  amazon_search_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('amazon_search_id');
    },
    set(value) {
      this.setDataValue('amazon_search_id', value);
    }
  },
  amazon_channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('amazon_channel_id');
    },
    set(value) {
      this.setDataValue('amazon_channel_id', value);
    }
  }
}, {
  underscored: true
});

export default AmazonData;
