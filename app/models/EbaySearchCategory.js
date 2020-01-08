const EbaySearchCategory = (sequelize: any, DataTypes: any) => sequelize.define('ebay_search_categories', {
    ebay_search_id: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
      get() {
        return this.getDataValue('ebay_search_id');
      },
      set(value) {
        this.setDataValue('ebay_search_id', value);
      }
    }, 
    ebay_category_id: {
        type: DataTypes.INTEGER(4),
        allowNull: false,
        get() {
          return this.getDataValue('ebay_category_id');
        },
        set(value) {
          this.setDataValue('ebay_category_id', value);
        }
      }
  }, {
    underscored: true
  });
  
  export default EbaySearchCategory;
  