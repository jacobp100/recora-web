import React from 'react';
import classnames from 'classnames';
import * as totalRow from '../../styles/total-row.css';

export default function TotalRow({ ready, total }) {
  return (
    <div className={totalRow.container}>
      <div className={totalRow.header}>
        Total
      </div>
      <div className={classnames(totalRow.total, !ready && totalRow.unloaded)}>
        { total }
      </div>
    </div>
  );
}
