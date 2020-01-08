const BookIdentifier = (sequelize: any, DataTypes: any) => sequelize.define('book_identifier', {
  value: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('value');
    },
    set(value) {
      this.setDataValue('value', value);
    }
  },
  type: { // ISBN13 or ISBN10 or ASIN
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'ISBN13',
    get() {
      return this.getDataValue('type');
    },
    set(value) {
      this.setDataValue('type', value);
    }
  }
}, {
  underscored: true
});

export default BookIdentifier;
