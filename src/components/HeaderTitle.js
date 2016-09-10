import React from 'react';
import { title } from '../../styles/header-title.css';

const HeaderTitle = ({ children }) => (
  <div className={title}>
    { children }
  </div>
);

export default HeaderTitle;
