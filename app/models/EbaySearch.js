const EbaySearch = (sequelize: any, DataTypes: any) => sequelize.define('ebay_search', {
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
  type: { // COMPLETED or LIVE
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'COMPLETED',
    get() {
      return this.getDataValue('type');
    },
    set(value) {
      this.setDataValue('type', value);
    }
  },
  search_period: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 7,
    get() {
      return this.getDataValue('search_period');
    },
    set(value) {
      this.setDataValue('search_period', value);
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    get() {
      return this.getDataValue('is_active');
    },
    set(value) {
      this.setDataValue('is_active', value);
    }
  },
  is_manual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    get() {
      return this.getDataValue('is_manual');
    },
    set(value) {
      this.setDataValue('is_manual', value);
    }
  },
  is_initial: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    get() {
      return this.getDataValue('is_initial');
    },
    set(value) {
      this.setDataValue('is_initial', value);
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
  total_results_fetched: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('total_results_fetched');
    },
    set(value) {
      this.setDataValue('total_results_fetched', value);
    }
  },
  total_duplicates_fetched: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    get() {
      return this.getDataValue('total_duplicates_fetched');
    },
    set(value) {
      this.setDataValue('total_duplicates_fetched', value);
    }
  },
  last_search_date: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('last_search_date');
    },
    set(value) {
      this.setDataValue('last_search_date', value);
    }
  },
  searched_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
    get() {
      return this.getDataValue('searched_at');
    },
    set(value) {
      this.setDataValue('searched_at', value);
    }
  }
}, {
  underscored: true
});

export default EbaySearch;
