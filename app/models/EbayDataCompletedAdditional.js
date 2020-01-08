const EbayDataCompleted = (sequelize: any, DataTypes: any) => sequelize.define('ebay_data_completed', {
  ebay_id: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('ebay_id');
    },
    set(value) {
      this.setDataValue('ebay_id', value);
    }
  },
  search_keyword: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      return this.getDataValue('search_keyword');
    },
    set(value) {
      this.setDataValue('search_keyword', value);
    }
  },
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
  currency_code: {
    type: DataTypes.STRING(3),
    allowNull: false,
    get() {
      return this.getDataValue('currency_code');
    },
    set(value) {
      this.setDataValue('currency_code', value);
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    get() {
      return this.getDataValue('price');
    },
    set(value) {
      this.setDataValue('price', value);
    }
  },
  listing_type: {
    type: DataTypes.STRING,
    allowNull: false,
    get() {
      return this.getDataValue('listing_type');
    },
    set(value) {
      this.setDataValue('listing_type', value);
    }
  },
  condition: {
    type: DataTypes.INTEGER(5).UNSIGNED,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('condition');
    },
    set(value) {
      this.setDataValue('condition', value);
    }
  },
  seller_name: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      return this.getDataValue('seller_name');
    },
    set(value) {
      this.setDataValue('seller_name', value);
    }
  },
  seller_feedback: {
    type: DataTypes.INTEGER(10).UNSIGNED,
    allowNull: true,
    get() {
      return this.getDataValue('seller_feedback');
    },
    set(value) {
      this.setDataValue('seller_feedback', value);
    }
  },
  view_url: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('view_url');
    },
    set(value) {
      this.setDataValue('view_url', value);
    }
  },
  listing_started: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('listing_started');
    },
    set(value) {
      this.setDataValue('listing_started', value);
    }
  },
  listing_ended: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('listing_ended');
    },
    set(value) {
      this.setDataValue('listing_ended', value);
    }
  },
  is_fake: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('is_fake');
    },
    set(value) {
      this.setDataValue('is_fake', value);
    }
  },
  is_spam: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('is_spam');
    },
    set(value) {
      this.setDataValue('is_spam', value);
    }
  },
  is_needed_checking: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('is_needed_checking');
    },
    set(value) {
      this.setDataValue('is_needed_checking', value);
    }
  },
  ebay_channel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('ebay_channel_id');
    },
    set(value) {
      this.setDataValue('ebay_channel_id', value);
    }
  },
  ebay_category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    get() {
      return this.getDataValue('ebay_category_id');
    },
    set(value) {
      this.setDataValue('ebay_category_id', value);
    }
  },
  image_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    get() {
      return this.getDataValue('image_id');
    },
    set(value) {
      this.setDataValue('image_id', value);
    }
  }
}, {
  underscored: true,
  freezeTableName: true
});

export default EbayDataCompleted;
