const BookEbayKeyword = (sequelize: any, DataTypes: any) => sequelize.define('book_ebay_keyword', {
  keyword: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('keyword');
    },
    set(value) {
      this.setDataValue('keyword', value);
    }
  },
  min_price: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('min_price');
    },
    set(value) {
      this.setDataValue('min_price', value);
    }
  },
  max_price: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('max_price');
    },
    set(value) {
      this.setDataValue('max_price', value);
    }
  }
}, {
  underscored: true
});

export default BookEbayKeyword;
