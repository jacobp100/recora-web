import React from 'react';
import classnames from 'classnames';
import * as header from '../../styles/header.css';

export function Header({ children }) {
  return (
    <div className={header.container}>
      { children }
    </div>
  );
}

export function HeaderSection({ place, children }) {
  return (
    <div className={classnames(header.section, header[place])}>
      { children }
    </div>
  );
}
