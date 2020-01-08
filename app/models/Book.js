const Book = (sequelize: any, DataTypes: any) => sequelize.define('book', {
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
  language: {
    type: DataTypes.INTEGER(4),
    allowNull: true, 
    defaultValue: null, 
    get() {
      return this.getDataValue('book_language_id');
    }, 
    set(value) {
      this.setDataValue('book_language_id', value);
    }
  }, 
  publisher: {
    type: DataTypes.INTEGER(4),
    allowNull: true, 
    defaultValue: null, 
    get() {
      return this.getDataValue('book_publisher_id');
    }, 
    set(value) {
      this.setDataValue('book_publisher_id', value);
    }
  }, 
  year: {
    type: DataTypes.INTEGER(4),
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('year');
    },
    set(value) {
      this.setDataValue('year', value);
    }
  },
  series: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('series');
    },
    set(value) {
      this.setDataValue('series', value);
    }
  },
  series_number: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('series_number');
    },
    set(value) {
      this.setDataValue('series_number', value);
    }
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('notes');
    },
    set(value) {
      this.setDataValue('notes', value);
    }
  },
  cover_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('cover_price');
    },
    set(value) {
      this.setDataValue('cover_price', value);
    }
  },
  avg_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('avg_price');
    },
    set(value) {
      this.setDataValue('avg_price', value);
    }
  },
  min_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('min_price');
    },
    set(value) {
      this.setDataValue('min_price', value);
    }
  },
  max_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
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

export default Book;
