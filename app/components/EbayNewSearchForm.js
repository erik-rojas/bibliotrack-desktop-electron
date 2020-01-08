// @flow
import React, { Component } from 'react';
import { Field, reduxForm, change, blur, touch, submit } from 'redux-form';
import { Button, Form, Input, InputNumber, Select, Switch, Checkbox, Icon } from 'antd';

const FormItem = Form.Item;
const Option = Select.Option;

const switchField = (field) => (
  <FormItem
    {...field.layout}
    label={field.label}
    required={field.required}
  >
    <Switch {...field.input} checked={field.input.value || false} />
  </FormItem>
);

const inputField = (field) => (
  <FormItem
    {...field.layout}
    label={field.label}
    required={field.required}
  >
    <Input {...field.input} />
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
      style={{ marginBottom: 20 }}
      {...field.layout}
      label={field.label}
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <InputNumber {...field.input} min={0} max={90} />
      <span>(0 = <b>unscheduled</b>)</span>
    </FormItem>
  );
};

const inputNumberDecimalField = (field) => {
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
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <InputNumber
        {...field.input}
        min={0.01}
        max={1000.00}
        step={0.01}
      />
    </FormItem>
  );
};

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
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <Select
        style={{ width: '75%' }}
        value={field.input.value === '' ? [] : field.input.value}
        onFocus={field.input.onFocus}
        onBlur={field.handleSelectBlur}
        onChange={field.handleSelectChange}
        mode="multiple"
        allowClear
      >
        {field.options}
      </Select>
    </FormItem>
  );
};

const selectSingleField = (field) => {
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
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <Select
        style={{ width: '120px' }}
        {...field.input}
      >
        {field.options}
      </Select>
    </FormItem>
  );
};

const rules = {
  requiredSelectField: value => (Array.isArray(value) && value.length !== 0 ? undefined : 'Required at least one'),
  requiredField: value => (value ? undefined : 'Required')
};

class EbayNewSearchForm extends Component {
  props: {
    loading: boolean,
    dispatch: () => void,
    onSubmit: () => void
  };

  handleChannelsSelectChange = (value) => {
    this.props.dispatch(change('ebayNewSearch', 'channels', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebayNewSearch', 'channels'));
  };

  handleChannelsSelectBlur = (value) => {
    this.props.dispatch(blur('ebayNewSearch', 'channels', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebayNewSearch', 'channels'));
  };

  handleCategoriesSelectChange = (value) => {
    this.props.dispatch(change('ebayNewSearch', 'categories', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebayNewSearch', 'categories'));
  };

  handleCategoriesSelectBlur = (value) => {
    this.props.dispatch(blur('ebayNewSearch', 'categories', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebayNewSearch', 'categories'));
  };

  handleClick = () => {
    this.props.dispatch(submit('ebayNewSearch'));
  };

  render() {
    const {
      onSubmit, loading
    } = this.props;

    const formItemLayout = {
      labelCol: {
        xs: { span: 20 },
        sm: { span: 6 },
      },
      wrapperCol: {
        xs: { span: 20 },
        sm: { span: 15 },
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

    const types = [
      <Option key="completed">Completed</Option>,
      <Option key="live" disabled>Live</Option>
    ];

    const channels = [
      <Option key="ebay.co.uk">ebay.co.uk</Option>,
      <Option key="ebay.de">ebay.de</Option>,
      <Option key="ebay.it">ebay.it</Option>,
      <Option key="ebay.fr">ebay.fr</Option>,
      <Option key="ebay.es">ebay.es</Option>,
      <Option key="ebay.com">ebay.com</Option>
    ];

    const categories = [
      <Option key="267">Books - 267</Option>,
      <Option key="63">Comic Books - 63</Option>
    ];

    return (
      <Form onSubmit={onSubmit}>
        <Field
          name="type"
          label="Type"
          options={types}
          layout={formItemLayout}
          component={selectSingleField}
          required
        />
        <Field name="isActive" label="Active" layout={formItemLayout} component={switchField} style={{ marginBottom: 5 }} />
        <Field name="keywords" label="Keywords" layout={formItemLayout} component={inputField} />
        <Field
          name="minPrice"
          label="Min price"
          layout={formItemLayout}
          component={inputNumberDecimalField}
        />
        <Field
          name="maxPrice"
          label="Max price"
          layout={formItemLayout}
          component={inputNumberDecimalField}
        />
        <Field
          name="channels"
          label="Channels"
          handleSelectChange={this.handleChannelsSelectChange}
          handleSelectBlur={this.handleChannelsSelectBlur}
          options={channels}
          layout={formItemLayout}
          component={selectField}
          validate={rules.requiredSelectField}
          required
        />
        <Field
          name="categories"
          label="Categories"
          handleSelectChange={this.handleCategoriesSelectChange}
          handleSelectBlur={this.handleCategoriesSelectBlur}
          options={categories}
          layout={formItemLayout}
          component={selectField}
          validate={rules.requiredSelectField}
          required
        />
        <Field
          name="searchPeriod"
          label="Search period (hours)"
          layout={formItemLayout}
          component={inputNumberField}
          validate={rules.requiredField}
          required
        />
        <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            loading={loading}
            onClick={this.handleClick}
          >
            <Icon type="plus" />Add
          </Button>
        </FormItem>
      </Form>
    );
  }
}

const WrappedForm = reduxForm({
  form: 'ebayNewSearch'
})(EbayNewSearchForm);

export default WrappedForm;
