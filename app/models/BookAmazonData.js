const BookAmazonData = (sequelize: any, DataTypes: any) => sequelize.define('book_amazon_data', {
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
    type: DataTypes.STRING,
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
    }
  },
  currency_code: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('currency_code');
    },
    set(value) {
      this.setDataValue('currency_code', value);
    }
  },
  new_lowest_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    get() {
      return this.getDataValue('new_lowest_price');
    },
    set(value) {
      this.setDataValue('new_lowest_price', value);
    }
  },
  used_lowest_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    get() {
      return this.getDataValue('used_lowest_price');
    },
    set(value) {
      this.setDataValue('used_lowest_price', value);
    }
  },
  new_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('new_count');
    },
    set(value) {
      this.setDataValue('new_count', value);
    }
  },
  used_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('used_count');
    },
    set(value) {
      this.setDataValue('used_count', value);
    }
  }
}, {
  underscored: true
});

export default BookAmazonData;
