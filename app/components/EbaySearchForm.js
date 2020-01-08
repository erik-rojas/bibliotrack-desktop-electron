// @flow
import React, { Component } from 'react';
import { Field, reduxForm, change, blur, touch, submit, initialize } from 'redux-form';
import { Button, Form, Badge, Input, InputNumber, Select, Switch, Popconfirm, Checkbox } from 'antd';

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

const checkboxField = (field) => (
  <Checkbox
    {...field.input}
    checked={field.input.value || false}
    disabled={field.disabled}
  >
    {field.label}
  </Checkbox>
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

const selectFieldSingle = (field) => {
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

class EbaySearchForm extends Component {
  props: {
    dispatch: () => void,
    onSubmit: () => void,
    onDelete: (searchId: string) => void,
    search: {
      id: string,
      isActive: boolean,
      keywords: string,
      status: string,
      lastSearch: string,
      searchPeriod: number,
      useSmartStop: boolean,
      useExtendedInitial: boolean,
      minPrice: number | null,
      maxPrice: number | null,
      categories: [],
      channels: [],
      type: string
    },
    loading: boolean
  };

  componentDidMount() {
    this.props.dispatch(initialize(
      'ebaySearch', {
        id: this.props.search.id,
        type: this.props.search.type,
        isActive: this.props.search.isActive,
        keywords: this.props.search.keywords,
        searchPeriod: this.props.search.searchPeriod.toString(),
        useSmartStop: this.props.search.useSmartStop,
        useExtendedInitial: this.props.search.useExtendedInitial,
        minPrice: this.props.search.minPrice !== null
          ? this.props.search.minPrice.toString()
          : '',
        maxPrice: this.props.search.maxPrice !== null
          ? this.props.search.maxPrice.toString()
          : '',
        categories: this.props.search.categories.map(item => item.ebay_id),
        channels: this.props.search.channels.map(item => item.name)
      },
      ['id', 'type', 'isActive', 'keywords', 'searchPeriod', 'useSmartStop', 'useExtendedInitial',
        'minPrice', 'maxPrice', 'categories', 'channels']
    ));
  }

  handleChannelsSelectChange = (value) => {
    this.props.dispatch(change('ebaySearch', 'channels', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebaySearch', 'channels'));
  };

  handleChannelsSelectBlur = (value) => {
    this.props.dispatch(blur('ebaySearch', 'channels', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebaySearch', 'channels'));
  };

  handleCategoriesSelectChange = (value) => {
    this.props.dispatch(change('ebaySearch', 'categories', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebaySearch', 'categories'));
  };

  handleCategoriesSelectBlur = (value) => {
    this.props.dispatch(blur('ebaySearch', 'categories', value.length === 0 ? [] : value));
    this.props.dispatch(touch('ebaySearch', 'categories'));
  };

  handleSave = () => {
    this.props.dispatch(change('ebaySearch', 'restartSearch', false));
    this.props.dispatch(submit('ebaySearch'));
  };

  handleApply = () => {
    this.props.dispatch(change('ebaySearch', 'restartSearch', true));
    this.props.dispatch(submit('ebaySearch'));
  };

  handleDelete = () => {
    this.props.onDelete(this.props.search.id);
  };

  render() {
    const {
      onSubmit, loading, search
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

    const types = [
      <Option key="Completed">Completed</Option>,
      <Option key="Live" disabled>Live</Option>
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

    let statusField = '';

    if (search.status === '') {
      statusField = <Badge status="processing" text="Loading" />;
    } else if (search.status === 'Disabled') {
      statusField = <Badge status="default" text="Disabled" />;
    } else if (search.status === 'Waiting') {
      statusField = <Badge status="success" text="Waiting" />;
    } else if (search.status === 'Searching') {
      statusField = <Badge status="processing" text="Searching" />;
    }

    return (
      <Form onSubmit={onSubmit}>
        <FormItem {...formItemLayout} label="Status" style={{ marginBottom: 10 }}>
          {statusField}
        </FormItem>
        <FormItem {...formItemLayout} label="Last search" style={{ marginBottom: 10 }}>
          {search.lastSearch === '' ? '\u2014' : search.lastSearch}
        </FormItem>
        <FormItem {...formItemLayout} label="Type" style={{ marginBottom: 10 }}>
          {search.type}
        </FormItem>
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
            onClick={this.handleSave}
          >
            Save
          </Button>
          <Button
            style={{ marginLeft: 5 }}
            type="primary"
            loading={loading}
            onClick={this.handleApply}
          >
            Save and Restart
          </Button>
          <Popconfirm
            title="Are you sure?"
            onConfirm={this.handleDelete}
          >
            <Button
              style={{ marginLeft: 5, lineHeight: 2.4 }}
              type="danger"
              loading={loading}
            >
              Delete
            </Button>
          </Popconfirm>
        </FormItem>
      </Form>
    );
  }
}

const WrappedForm = reduxForm({
  form: 'ebaySearch'
})(EbaySearchForm);

export default WrappedForm;
