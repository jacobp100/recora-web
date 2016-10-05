// @flow
import React, { PropTypes } from 'react';
import classnames from 'classnames';
import { container, header, unloaded, total } from '../../styles/total-row.css';

const TotalRow = ({ ready, totalValue }: Object) => (
  <div className={container}>
    <div className={header}>
      Total
    </div>
    <div className={classnames(total, !ready && unloaded)}>
      {totalValue}
    </div>
  </div>
);

TotalRow.propTypes = {
  ready: PropTypes.bool,
  totalValue: PropTypes.string,
};

export default TotalRow;
