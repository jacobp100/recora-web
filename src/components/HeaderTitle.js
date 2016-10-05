// @flow
import React, { PropTypes } from 'react';
import { title } from '../../styles/header-title.css';

const HeaderTitle = ({ children }: Object) => (
  <div className={title}>
    {children}
  </div>
);

HeaderTitle.propTypes = {
  children: PropTypes.string,
};

export default HeaderTitle;
