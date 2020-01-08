// @flow
const { dialog } = require('electron').remote;
const fs = require('fs');

import React, { Component } from 'react';
import {blur, change, Field, reduxForm, submit, touch} from 'redux-form';
import { Button, Form, Input, InputNumber, Select, Icon, AutoComplete } from 'antd';

import styles from './NewBookForm.css';

const { TextArea } = Input;
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
      style={field.style}
      label={field.label}
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <Input {...field.input} style={{ width: '90%' }}/>
      {
        field.withAddButton === true
          ? <span>
              <Icon
                type="plus-circle"
                style={{ fontSize: 18, marginLeft: 5, cursor: 'pointer', color: '#08c' }}
                onClick={() => {
                  field.increment();
                }}
              />
              <Icon
                type="minus-circle"
                style={{ fontSize: 18, marginLeft: 5, cursor: 'pointer', color: '#f5222d' }}
                onClick={() => {
                  field.decrement();
                }}
              />
            </span>
          : ''
      }
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
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <TextArea autosize={{ minRows: 2, maxRows: 6 }} {...field.input} />
    </FormItem>
  );
};

const inputAutoCompleteField = (field) => {
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
      style={field.style}
      {...field.layout}
      label={field.label}
      required={field.required}
      validateStatus={validateStatus}
      help={help}
    >
      <AutoComplete
        {...field.input}
        dataSource={field.dataSource}
        style={{ width: 400 }}
        onSearch={field.onSearch}
      />
      {
        field.withAddButton === true
          ? <span>
            <Icon
              type="plus-circle"
              style={{ fontSize: 18, marginLeft: 5, cursor: 'pointer', color: '#08c' }}
              onClick={() => {
                field.increment();
              }}
            />
            <Icon
              type="minus-circle"
              style={{ fontSize: 18, marginLeft: 5, cursor: 'pointer', color: '#f5222d' }}
              onClick={() => {
                field.decrement();
              }}
            />
          </span>
          : ''
      }
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
      <InputNumber {...field.input} min={0} max={3000} />
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
      <InputNumber {...field.input} step={0.1} min={0} max={3000} />
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
        value={field.input.value}
        onFocus={field.input.onFocus}
        onBlur={field.handleSelectBlur}
        onChange={field.handleSelectChange}
        allowClear={field.allowClear}
      >
        {field.options}
      </Select>
    </FormItem>
  );
};

const imageSelection = (field) => {
  return (
    <span style={{ display: 'inline-block', marginLeft: '25%' }}>
      <img
        src={`data:${field.input.value}`}
        alt="No image"
        className={styles.image}
      />
      <Button
        style={{ marginLeft: 15, float: 'left' }}
        onClick={() => dialog.showOpenDialog({ properties: ['openFile'], filters: [
            { name: 'Images', extensions: ['jpg', 'png'] }
          ]}, filePaths => {

          fs.readFile(filePaths[0], (err, data) => {
            if (!err) {
              field.update(`image/${filePaths[0].split('.').pop()};base64,${Buffer.from(data).toString('base64')}`);
            }
          });
        })}
      >
        <Icon type="folder-open" />
        Select image
      </Button>
    </span>
  );
};

const rules = {
  requiredSelectField: value => (Array.isArray(value) && value.length !== 0 ? undefined : 'Required at least one'),
  requiredField: value => (value && value !== '' ? undefined : 'Required')
};

class NewBookForm extends Component {
  props: {
    loading: boolean,
    dispatch: () => void,
    onSubmit: () => void,
    onAutoComplete: (field: string, value: string) => void,
    autoCompleteData: {
      authors: [],
      publishers: [],
      filtered: {
        authors: [],
        publishers: []
      }
    }
  };

  additionalAuthors = 0;
  additionalSerialNumbers = 0;

  handleClick = () => {
    this.props.dispatch(submit('newBook'));
  };

  handleLanguageSelectBlur = (value) => {
    this.props.dispatch(blur('newBook', 'language', value === undefined ? '' : value));
    this.props.dispatch(touch('newBook', 'language'));
  };

  handleLanguageSelectChange = (value) => {
    this.props.dispatch(change('newBook', 'language', value === undefined ? '' : value));
    this.props.dispatch(touch('newBook', 'language'));
  };

  render() {
    const {
      onSubmit, loading, autoCompleteData, onAutoComplete
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

    const languages = [
      <Option key="English">English</Option>,
      <Option key="Italian">Italian</Option>,
      <Option key="French">French</Option>,
      <Option key="German">German</Option>,
      <Option key="Spanish">Spanish</Option>,
      <Option key="Multilingual">Multilingual</Option>
    ];

    const additionalAuthors = [];

    for (let index = 0; index < this.additionalAuthors; index++) {
      additionalAuthors.push(
        <Field
          key={`author_${index + 1}`}
          name={`author_${index + 1}`}
          label=""
          style={{ marginLeft: '25%' }}
          layout={formItemLayout}
          component={inputAutoCompleteField}
          dataSource={autoCompleteData.filtered.authors}
          onSearch={(value) => onAutoComplete('authors', value)}
          withAddButton={false}
        />
      );
    }

    const additionalISBNs = [];

    for (let index = 0; index < this.additionalSerialNumbers; index++) {
      additionalISBNs.push(
        <Field
          key={`isbn_13_${index + 1}`}
          name={`isbn_13_${index + 1}`}
          label=""
          style={{ marginLeft: '25%' }}
          layout={formItemLayout}
          component={inputField}
        />
      );
    }

    return (
      <Form onSubmit={onSubmit}>
        <Field name="year" label="Year" layout={formItemLayout} component={inputNumberField} />
        <Field
          name="title"
          label="Title"
          layout={formItemLayout}
          component={inputField}
          validate={rules.requiredField}
          required
        />
        <Field
          name="author"
          label="Author"
          layout={formItemLayout}
          component={inputAutoCompleteField}
          dataSource={autoCompleteData.filtered.authors}
          onSearch={(value) => onAutoComplete('authors', value)}
          increment={() => { this.additionalAuthors = this.additionalAuthors + 1; this.forceUpdate(); }}
          decrement={() => {
            this.props.dispatch(change('newBook', `author_${this.additionalAuthors}`, null));
            this.additionalAuthors = this.additionalAuthors === 0 ? 0 : this.additionalAuthors - 1;
            this.forceUpdate();
          }}
          withAddButton={true}
        />
        {additionalAuthors}
        <Field
          name="publisher"
          label="Publisher"
          layout={formItemLayout}
          component={inputAutoCompleteField}
          dataSource={autoCompleteData.filtered.publishers}
          onSearch={(value) => onAutoComplete('publishers', value)}
        />
        <Field
          name="series"
          label="Series"
          layout={formItemLayout}
          component={inputField}
        />
        <Field
          name="seriesNumber"
          label="Series number"
          layout={formItemLayout}
          component={inputNumberField}
        />
        <Field
          name="language"
          label="Language"
          options={languages}
          layout={formItemLayout}
          component={selectSingleField}
          handleSelectBlur={this.handleLanguageSelectBlur}
          handleSelectChange={this.handleLanguageSelectChange}
          allowClear
        />
        <Field
          name="isbn_10"
          label="ISBN 10"
          layout={formItemLayout}
          component={inputField}
        />
        <Field
          name="isbn_13"
          label="ISBN 13"
          layout={formItemLayout}
          component={inputField}
          increment={() => { this.additionalSerialNumbers = this.additionalSerialNumbers + 1; this.forceUpdate(); }}
          decrement={() => {
            this.props.dispatch(change('newBook', `isbn_13_${this.additionalSerialNumbers}`, null));
            this.additionalSerialNumbers = this.additionalSerialNumbers === 0 ? 0 : this.additionalSerialNumbers - 1;
            this.forceUpdate();
          }}
          withAddButton={true}
        />
        {additionalISBNs}
        <Field
          name="asin"
          label="ASIN"
          layout={formItemLayout}
          component={inputField}
        />
        <Field
          name="coverPrice"
          label="Cover price"
          layout={formItemLayout}
          component={inputNumberDecimalField}
        />
        <Field
          name="cover"
          update={(data) => this.props.dispatch(change('newBook', 'cover', data))}
          component={imageSelection}
        />
        <Field
          name="notes"
          label="Notes"
          layout={formItemLayout}
          component={textareaField}
        />
        <FormItem {...tailFormItemLayout} style={{ marginBottom: 0 }}>
          <Button
            style={{ marginBottom: 10 }}
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
  form: 'newBook'
})(NewBookForm);

export default WrappedForm;
