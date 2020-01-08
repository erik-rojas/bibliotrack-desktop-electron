const BookLanguage = (sequelize: any, DataTypes: any) => sequelize.define('book_language', {
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
  short_code: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('short_code');
    },
    set(value) {
      this.setDataValue('short_code', value);
    }
  }
}, {
  underscored: true
});

export default BookLanguage;
