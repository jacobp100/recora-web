// @flow
import React from 'react';
import classnames from 'classnames';
import { container, header, unloaded, total } from '../../styles/total-row.css';

export default function TotalRow({ ready, totalValue }) {
  return (
    <div className={container}>
      <div className={header}>
        Total
      </div>
      <div className={classnames(total, !ready && unloaded)}>
        { totalValue }
      </div>
    </div>
  );
}
