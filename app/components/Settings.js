// @flow
import React, { Component } from 'react';
import { message, notification } from 'antd';

import SettingsForm from './SettingsForm';

class Settings extends Component {
  props: {
    init: () => void,
    destroy: () => void,
    loadSettings: () => void,
    saveSettings: () => void,
    fixEbayApprovedItems: () => void,
    status: string,
    message: string,
    description: string | void,
    values: {} | void
  };

  componentDidMount() {
    this.props.init();
  }

  componentDidUpdate() {
    if (((this.props.status !== '') && (this.props.message !== ''))) {
      message.destroy();
      notification.destroy();

      if (this.props.status === 'loading') {
        message.loading(this.props.message, 10);
      } else if (this.props.status === 'success') {
        message.success(this.props.message, 1.7);
      } else if (this.props.status === 'error') {
        notification.error({
          message: this.props.message,
          description: this.props.description,
          duration: 10
        });
      }
    }
  }

  componentWillUnmount() {
    this.props.destroy();
  }

  handleSubmit = (event: {preventDefault: () => void}) => {
    event.preventDefault();

    this.props.saveSettings();
  };

  render() {
    const {
      values,
      loadSettings,
      fixEbayApprovedItems
    } = this.props;

    return (
      <div>
        <SettingsForm
          initialValues={values}
          handleSubmit={this.handleSubmit}
          loadSettings={loadSettings}
          fixEbayApprovedItems={fixEbayApprovedItems}
        />
      </div>
    );
  }
}

export default Settings;
