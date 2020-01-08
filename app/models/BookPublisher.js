const BookPublisher = (sequelize: any, DataTypes: any) => sequelize.define('book_publisher', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('name');
    },
    set(value) {
      this.setDataValue('name', value);
    }
  }
}, {
  underscored: true
});

export default BookPublisher;
