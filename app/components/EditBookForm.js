// @flow
const { dialog } = require('electron').remote;
const fs = require('fs');

import React, { Component } from 'react';
import { blur, change, Field, initialize, reduxForm, submit, touch, untouch } from 'redux-form';
import { Button, Form, Input, InputNumber, Select, Icon, AutoComplete } from 'antd';

import styles from './EditBookForm.css';

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

class EditBookForm extends Component {
  props: {
    dispatch: () => void,
    loading: boolean,
    onSubmit: () => void,
    onAutoComplete: (field: string, value: string) => void,
    autoCompleteData: {
      authors: [],
      publishers: [],
      filtered: {
        authors: [],
        publishers: []
      }
    },
    bookData: {
      id: string,
      title: string,
      language: string | null,
      year: number | null,
      author: string | null,
      publisher: string | null,
      isbn_10: string | null,
      isbn_13: string | null,
      asin: string | null,
      series: string | null,
      series_number: number | string | null,
      notes: string | null,
      cover_price: number | string | null,
      cover: string | null,
      additional_authors: [],
      additional_authors_count: number,
      additional_serial_numbers: [],
      additional_serial_numbers_count: number
    },
    setAuthorsSizeForSelectedBook: (size: number) => void,
    setSerialsSizeForSelectedBook: (size: number) => void
  };

  componentDidMount() {
    this.props.dispatch(initialize(
      'editBook', {
        id: this.props.bookData.id,
        title: this.props.bookData.title,
        language: this.props.bookData.language || '',
        author: this.props.bookData.author || '',
        year: this.props.bookData.year || '',
        publisher: this.props.bookData.publisher || '',
        isbn_10: this.props.bookData.isbn_10 || '',
        isbn_13: this.props.bookData.isbn_13 || '',
        asin: this.props.bookData.asin || '',
        series: this.props.bookData.series || '',
        seriesNumber: this.props.bookData.series_number || '',
        notes: this.props.bookData.notes || '',
        coverPrice: this.props.bookData.cover_price || '',
        cover: this.props.bookData.cover || ''
      },
      ['id', 'title', 'language', 'author', 'year', 'publisher', 'isbn_10', 'isbn_13',
        'asin', 'series', 'seriesNumber', 'notes', 'coverPrice', 'cover']
    ));

    this.props.bookData.additional_authors.forEach((author, index) => {
      this.props.dispatch(change('editBook', `author_${index + 1}`, author));
    });

    this.props.bookData.additional_serial_numbers.forEach((isbn, index) => {
      this.props.dispatch(change('editBook', `isbn_13_${index + 1}`, isbn));
    });
  }

  handleClick = () => {
    this.props.dispatch(submit('editBook'));
  };

  handleLanguageSelectBlur = (value) => {
    this.props.dispatch(blur('editBook', 'language', value === undefined ? '' : value));
    this.props.dispatch(touch('editBook', 'language'));
  };

  handleLanguageSelectChange = (value) => {
    this.props.dispatch(change('editBook', 'language', value === undefined ? '' : value));
    this.props.dispatch(touch('editBook', 'language'));
  };

  render() {
    const {
      onSubmit, loading, setAuthorsSizeForSelectedBook,
      autoCompleteData, onAutoComplete, bookData, setSerialsSizeForSelectedBook
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

    for (let index = 0; index < bookData.additional_authors_count; index++) {
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
        />
      );
    }

    const additionalISBNs = [];

    for (let index = 0; index < bookData.additional_serial_numbers_count; index++) {
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
          increment={() => setAuthorsSizeForSelectedBook(bookData.additional_authors_count + 1)}
          decrement={() => {
            setAuthorsSizeForSelectedBook(bookData.additional_authors_count - 1);
            this.props.dispatch(change('editBook', `author_${bookData.additional_authors_count}`, null));
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
          increment={() => setSerialsSizeForSelectedBook(bookData.additional_serial_numbers_count + 1)}
          decrement={() => {
            setSerialsSizeForSelectedBook(bookData.additional_serial_numbers_count - 1);
            this.props.dispatch(change('editBook', `isbn_13_${bookData.additional_serial_numbers_count}`, null));
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
          update={(data) => this.props.dispatch(change('editBook', 'cover', data))}
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
            <Icon type="save" />Save
          </Button>
        </FormItem>
      </Form>
    );
  }
}

const WrappedForm = reduxForm({
  form: 'editBook'
})(EditBookForm);

export default WrappedForm;
