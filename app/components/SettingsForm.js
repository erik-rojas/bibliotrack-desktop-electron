// @flow
import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form';
import { Button, Form, Input, Card, Checkbox, InputNumber } from 'antd';

import styles from './SettingsForm.css';

const FormItem = Form.Item;

const checkboxField = (field) => (
  <Checkbox
    {...field.input}
    checked={field.input.value || false}
    disabled={field.disabled}
  >
    {field.label}
  </Checkbox>
);

const textField = (field) => (
  <FormItem
    {...field.layout}
    label={field.label}
  >
    <Input {...field.input} type={field.type} />
  </FormItem>
);

const inputNumberField = (field) => {
  let validateStatus = '';
  let help = '';

  if (field.meta.touched && (field.meta.error || field.meta.warning)) {
    if (field.meta.error) {
      validateStatus = 'error';
      help = field.meta.error;
    } else if (field.meta.warning) {
      validateStatus = 'warning';
      help = field.meta.warning;
    }
  }

  return (
    <FormItem
      style={{ marginBottom: 10 }}
      {...field.layout}
      label={field.label}
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <InputNumber {...field.input} min={1} max={1000} />
      <span style={{ marginLeft: 5 }}>(days)</span>
    </FormItem>
  );
};

class SettingsForm extends Component {
  props: {
    loadSettings: () => void,
    dispatch: () => void,
    handleSubmit: () => void,
    fixEbayApprovedItems: () => void
  };

  componentDidMount() {
    this.props.loadSettings();
  }

  render() {
    const {
      handleSubmit, fixEbayApprovedItems
    } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 23 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 27 },
        sm: { span: 17 },
      },
    };

    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 14,
          offset: 6,
        },
      },
    };

    return (
      <Form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.cardGroup}>
          <Card title="Common" className={styles.commonCard}>
            <Field
              name="ebayFakePeriod"
              label="eBay fake period"
              layout={formItemLayout}
              component={inputNumberField}
            />
            <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                onClick={() => fixEbayApprovedItems()}
              >
                Fix approved eBay items
              </Button>
            </FormItem>
            <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
              >
                Save
              </Button>
            </FormItem>
          </Card>
          <Card title="Database" className={styles.databaseCard}>
            <Field name="host" label="Host" layout={formItemLayout} component={textField} />
            <Field name="databaseName" label="Database name" layout={formItemLayout} component={textField} />
            <Field name="login" label="Login" layout={formItemLayout} component={textField} />
            <Field name="password" label="Password" layout={formItemLayout} component={textField} />
            <Field name="useLog" label="Use log file" layout={tailFormItemLayout} component={checkboxField} />
            <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
              >
                Save
              </Button>
            </FormItem>
          </Card>
        </div>
        <div className={styles.cardGroup}>
          <Card title="Amazon API Keys" className={styles.amazonCard}>
            <Field name="associateTag" label="Associate tag" layout={formItemLayout} component={textField} />
            <Field name="accessKey" label="Access key" layout={formItemLayout} type="textarea" component={textField} />
            <Field name="secretKey" label="Secret key" layout={formItemLayout} type="textarea" component={textField} />
            <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
              >
                Save
              </Button>
            </FormItem>
          </Card>
          <Card title="eBay API Keys" className={styles.ebayCard}>
            <Field name="appId" label="App ID" layout={formItemLayout} component={textField} />
            <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
              >
                Save
              </Button>
            </FormItem>
          </Card>
        </div>
      </Form>
    );
  }
}

const WrappedSettingsForm = reduxForm({
  form: 'settings'
})(SettingsForm);

export default WrappedSettingsForm;
