const BookAuthors = (sequelize: any, DataTypes: any) => sequelize.define('books_authors', {
    book_id: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      get() {
        return this.getDataValue('book_id');
      },
      set(value) {
        this.setDataValue('book_id', value);
      }
    }, 
    book_author_id: {
        type: DataTypes.INTEGER(4),
        allowNull: false,
        get() {
          return this.getDataValue('book_author_id');
        },
        set(value) {
          this.setDataValue('book_author_id', value);
        }
      }
  }, {
    underscored: true
  });
  
  export default BookAuthors;
  