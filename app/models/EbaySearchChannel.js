const EbaySearchChannel = (sequelize: any, DataTypes: any) => sequelize.define('ebay_search_channels', {
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
    ebay_channel_id: {
        type: DataTypes.INTEGER(4),
        allowNull: false,
        get() {
          return this.getDataValue('ebay_channel_id');
        },
        set(value) {
          this.setDataValue('ebay_channel_id', value);
        }
      }
  }, {
    underscored: true
  });
  
  export default EbaySearchChannel;
  