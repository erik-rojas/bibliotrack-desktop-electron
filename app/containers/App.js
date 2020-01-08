// @flow
import React, { Component } from 'react';
import type { Children } from 'react';
import { Link } from 'react-router-dom';
import enUS from 'antd/lib/locale-provider/en_US';
import {
  LocaleProvider, Popover,
  Layout, Menu, Breadcrumb, Icon
} from 'antd';

import styles from './App.css';

const { Sider, Content } = Layout;

export default class App extends Component {
  props: {
    children: Children
  };

  render() {
    return (
      <div>
        <LocaleProvider locale={enUS}>
          <Layout style={{ minHeight: '100vh' }}>
            <Sider
              collapsed
              className={styles.sidebar}
            >
              <Menu
                theme="light"
                defaultSelectedKeys={['books']}
                mode="inline"
              >
                <Menu.Item key="books">
                  <Link to="/books">
                    <Icon type="book" />
                    <span>Books</span>
                  </Link>
                </Menu.Item>
                <Menu.Item key="amazon">
                  <Link to="/amazon-searches">
                    <Icon type="amazon" />
                    <span>Amazon</span>
                  </Link>
                </Menu.Item>
                <Menu.SubMenu
                  key="ebay"
                  title={<span><Icon type="shop" /><span>eBay</span></span>}
                >
                  <Menu.Item key="ebay-searches"><Link to="/ebay-searches">eBay searches</Link></Menu.Item>
                  <Menu.Item key="ebay-data"><Link to="/ebay-data">eBay data</Link></Menu.Item>
                </Menu.SubMenu>
                <Menu.Item key="settings">
                  <Link to="/settings">
                    <Icon type="setting" />
                    <span>Settings</span>
                  </Link>
                </Menu.Item>
              </Menu>
            </Sider>
            <Layout>
              <Content style={{ background: '#fff' }}>
                {this.props.children}
              </Content>
            </Layout>
          </Layout>
        </LocaleProvider>
      </div>
    );
  }
}
