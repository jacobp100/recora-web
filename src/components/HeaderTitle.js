import React from 'react';
import * as headerTitle from '../../styles/header-title.css';

export default function HeaderTitle({ children }) {
  return (
    <div className={headerTitle.title}>
      { children }
    </div>
  );
}
