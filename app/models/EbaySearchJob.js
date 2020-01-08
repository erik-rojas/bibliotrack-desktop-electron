const EbaySearchJob = (sequelize: any, DataTypes: any) => sequelize.define('ebay_search_job', {
  status: { // QUEUED or FINISHED or FAILED
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'QUEUED',
    get() {
      return this.getDataValue('status');
    },
    set(value) {
      this.setDataValue('status', value);
    }
  },
  current_page: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('current_page');
    },
    set(value) {
      this.setDataValue('current_page', value);
    }
  },
  search_time_offset: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('search_time_offset');
    },
    set(value) {
      this.setDataValue('search_time_offset', value);
    }
  },
  keywords: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
    get() {
      return this.getDataValue('keywords');
    },
    set(value) {
      this.setDataValue('keywords', value);
    }
  },
  min_price: {
    type: DataTypes.DECIMAL(10, 2),
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('max_price');
    },
    set(value) {
      this.setDataValue('max_price', value);
    }
  },
  use_extended_initial: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    get() {
      return this.getDataValue('use_extended_initial');
    },
    set(value) {
      this.setDataValue('use_extended_initial', value);
    }
  },
  use_smart_stop: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    get() {
      return this.getDataValue('use_smart_stop');
    },
    set(value) {
      this.setDataValue('use_smart_stop', value);
    }
  },
  results_fetched: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('results_fetched');
    },
    set(value) {
      this.setDataValue('results_fetched', value);
    }
  },
  duplicates_fetched: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('duplicates_fetched');
    },
    set(value) {
      this.setDataValue('duplicates_fetched', value);
    }
  }
}, {
  underscored: true
});

export default EbaySearchJob;
