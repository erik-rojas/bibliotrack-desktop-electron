// @flow
import React, { Component } from 'react';
import { blur, change, Field, initialize, reduxForm, submit, touch } from 'redux-form';
import { Button, Form, Input, InputNumber, Select, Icon, Switch } from 'antd';

const FormItem = Form.Item;
const Option = Select.Option;

const inputField = (field) => {
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
      <Input {...field.input} />
    </FormItem>
  );
};

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
      {...field.layout}
      label={field.label}
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <InputNumber {...field.input} min={0} step={0.1} max={10000} style={{ width: 200 }} />
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

const switchField = (field) => (
  <FormItem
    {...field.layout}
    label={field.label}
    required={field.required}
  >
    <Switch {...field.input} checked={field.input.value || false} />
  </FormItem>
);

const rules = {
  requiredSelectField: value => (Array.isArray(value) && value.length !== 0 ? undefined : 'Required at least one'),
  requiredField: value => (value && value !== '' ? undefined : 'Required')
};

class EditBookKeywordForm extends Component {
  props: {
    loading: boolean,
    keywordData: {
      id: string,
      keyword: string,
      isShared: boolean,
      minPrice: string | number | null,
      maxPrice: string | number | null,
      channels: [],
      categories: []
    },
    dispatch: () => void,
    onSubmit: () => void,
    bookId: string
  };

  componentDidMount() {
    this.props.dispatch(initialize(
      'editBookKeyword', {
        id: this.props.keywordData.id,
        keyword: this.props.keywordData.keyword,
        isShared: this.props.keywordData.isShared,
        minPrice: this.props.keywordData.minPrice,
        maxPrice: this.props.keywordData.maxPrice,
        channels: this.props.keywordData.channels.map(item => item.name),
        categories: this.props.keywordData.categories.map(item => item.ebay_id)
      },
      ['id', 'keyword', 'isShared', 'minPrice', 'maxPrice', 'channels', 'categories']
    ));
  }

  handleChannelsSelectChange = (value) => {
    this.props.dispatch(change('editBookKeyword', 'channels', value.length === 0 ? [] : value));
    this.props.dispatch(touch('editBookKeyword', 'channels'));
  };

  handleChannelsSelectBlur = (value) => {
    this.props.dispatch(blur('editBookKeyword', 'channels', value.length === 0 ? [] : value));
    this.props.dispatch(touch('editBookKeyword', 'channels'));
  };

  handleCategoriesSelectChange = (value) => {
    this.props.dispatch(change('editBookKeyword', 'categories', value.length === 0 ? [] : value));
    this.props.dispatch(touch('editBookKeyword', 'categories'));
  };

  handleCategoriesSelectBlur = (value) => {
    this.props.dispatch(blur('editBookKeyword', 'categories', value.length === 0 ? [] : value));
    this.props.dispatch(touch('editBookKeyword', 'categories'));
  };

  handleClick = () => {
    this.props.dispatch(submit('editBookKeyword'));
  };

  render() {
    const {
      onSubmit, loading
    } = this.props;

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

    return (
      <Form onSubmit={onSubmit}>
        <Field
          name="keyword"
          label="Keyword"
          layout={formItemLayout}
          component={inputField}
          validate={rules.requiredField}
          required
        />
        <Field
          name="isShared"
          label="Shared"
          layout={formItemLayout}
          component={switchField}
        />
        <Field
          name="minPrice"
          label="Min price"
          layout={formItemLayout}
          component={inputNumberField}
        />
        <Field
          name="maxPrice"
          label="Max price"
          layout={formItemLayout}
          component={inputNumberField}
        />
        <Field
          name="categories"
          label="Categories"
          handleSelectChange={this.handleCategoriesSelectChange}
          handleSelectBlur={this.handleCategoriesSelectBlur}
          layout={formItemLayout}
          options={categories}
          component={selectField}
          validate={rules.requiredField}
          required
        />
        <Field
          name="channels"
          label="Channels"
          handleSelectChange={this.handleChannelsSelectChange}
          handleSelectBlur={this.handleChannelsSelectBlur}
          layout={formItemLayout}
          options={channels}
          component={selectField}
          validate={rules.requiredField}
          required
        />
        <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            loading={loading}
            onClick={this.handleClick}
          >
            <Icon type="save" />Save
          </Button>
        </FormItem>
      </Form>
    );
  }
}

const WrappedForm = reduxForm({
  form: 'editBookKeyword'
})(EditBookKeywordForm);

export default WrappedForm;
