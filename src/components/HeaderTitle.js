import React from 'react';
import * as headerTitle from '../../styles/header-title.css';

const HeaderTitle = ({ children }) => (
  <div className={headerTitle.title}>
    { children }
  </div>
);

export default HeaderTitle;
