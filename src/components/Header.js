import React from 'react';
import classnames from 'classnames';
import * as header from '../../styles/header.css';

export const Header = ({ children }) => (
  <div className={header.container}>
    { children }
  </div>
);

export const HeaderSection = ({ place, children }) => (
  <div className={classnames(header.section, header[place])}>
    { children }
  </div>
);
