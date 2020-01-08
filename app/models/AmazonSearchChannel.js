const AmazonSearchChannel = (sequelize: any, DataTypes: any) => sequelize.define('amazon_search_channels', {
    amazon_search_id: {
        type: DataTypes.INTEGER(4),
        allowNull: false,
        get() {
            return this.getDataValue('amazon_search_id');
        },
        set(value) {
            this.setDataValue('amazon_search_id', value);
        }
    },
    amazon_channel_id: {
        type: DataTypes.INTEGER(4),
        allowNull: false,
        get() {
            return this.getDataValue('amazon_channel_id');
        },
        set(value) {
            this.setDataValue('amazon_channel_id', value);
        }
        }
  }, {
    underscored: true
  });
  
  export default AmazonSearchChannel;