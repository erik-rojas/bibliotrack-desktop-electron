// @flow
import React, { Component } from 'react';
import { Field, reduxForm, change, submit, blur, touch, reset } from 'redux-form';
import { Form, Input, Icon, Select, Checkbox, Button } from 'antd';

import styles from './AmazonNewSearchForm.css';

const { TextArea } = Input;
const FormItem = Form.Item;
const Option = Select.Option;

const textField = (field) => {
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
      {...field.layout}
      label={field.label}
      validateStatus={validateStatus}
      help={help}
      required
    >
      <Input {...field.input} type="text" />
    </FormItem>
  );
};

const textareaField = (field) => {
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
      {...field.layout}
      label={field.label}
      validateStatus={validateStatus}
      help={help}
      required
    >
      <TextArea {...field.input} rows="12" />
    </FormItem>
  );
};

const checkboxField = (field) => (
  <FormItem
    {...field.layout}
    label={field.label}
  >
    <Checkbox {...field.input} checked={field.input.value === '' ? false : field.input.value} />
  </FormItem>
);

const selectField = (field) => {
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
      {...field.layout}
      label={field.label}
      validateStatus={validateStatus}
      help={help}
      required
    >
      <Select
        value={field.input.value === '' ? [] : field.input.value}
        onFocus={field.input.onFocus} onBlur={field.handleSelectBlur}
        onChange={field.handleSelectChange}
        mode="multiple"
        allowClear
      >
        <Option key="amazon.co.uk">amazon.co.uk</Option>
        <Option key="amazon.de">amazon.de</Option>
        <Option key="amazon.it">amazon.it</Option>
        <Option key="amazon.fr">amazon.fr</Option>
        <Option key="amazon.es">amazon.es</Option>
        <Option key="amazon.com">amazon.com</Option>
      </Select>
    </FormItem>
  );
};

const requiredField = value => (value ? undefined : 'Required');
const maxLength = max => value =>
  (value && value.length > max ? `Must be ${max} characters or less` : undefined);
const maxLength255 = maxLength(255);
const minLength = min => value =>
  (value && value.length < min ? `Must be ${min} characters or more` : undefined);
const minLength2 = minLength(2);
const minLength10 = minLength(10);
const isbnsOrAsins = value =>
  (value && !/^(([A-Z0-9]-*){9,12}([A-Z0-9])(\s|\n|\r\n|,|;|\.)*)+$/ig.test(value)
    ? 'Invalid ISBNs/ASINs list'
    : undefined); // TODO: fix lag

class AmazonNewSearchForm extends Component {
  props: {
    dispatch: () => void,
    onSubmit: () => void,
    loading: boolean,
    formReset: boolean
  };

  componentDidUpdate() {
    if (this.props.formReset) this.props.dispatch(reset('search'));
  }

  handleSelectChange = (value) => {
    this.props.dispatch(change('search', 'channels', value.length === 0 ? null : value));
    this.props.dispatch(touch('search', 'channels'));
  };

  handleSelectBlur = (value) => {
    this.props.dispatch(blur('search', 'channels', value.length === 0 ? null : value));
    this.props.dispatch(touch('search', 'channels'));
  };

  handleClick = () => {
    this.props.dispatch(submit('search'));
  };

  render() {
    const { loading, onSubmit } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 14 },
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
      <Form className={styles.form} onSubmit={onSubmit}>
        <Field validate={[requiredField, maxLength255, minLength2]} name="name" label="Name" layout={formItemLayout} component={textField} />
        <Field validate={requiredField} name="channels" label="Channels" layout={formItemLayout} handleSelectChange={this.handleSelectChange} handleSelectBlur={this.handleSelectBlur} component={selectField} />
        <Field name="isAsins" label="ASINs" layout={formItemLayout} component={checkboxField} />
        <Field validate={[requiredField, minLength10, isbnsOrAsins]} name="isbnsOrAsins" label="ISBNs (ASINs)" layout={formItemLayout} component={textareaField} />
        <FormItem {...tailFormItemLayout}>
          <Button
            type="primary"
            onClick={this.handleClick}
            loading={loading}
          >
            <Icon type="plus" />Add
          </Button>
        </FormItem>
      </Form>
    );
  }
}

const WrappedAmazonNewSearchForm = reduxForm({
  form: 'search'
})(AmazonNewSearchForm);

export default WrappedAmazonNewSearchForm;
