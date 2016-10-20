// @flow
import React, { PropTypes } from 'react';
import { icon } from '../../styles/base.css';

const Icon = ({ iconName, ...props }: Object) => (
  <svg className={icon} viewBox="0 0 12 12" {...props}>
    <use xlinkHref={`/dist/icons.svg#${iconName}`} />
  </svg>
);

Icon.propTypes = {
  iconName: PropTypes.string,
};

export default Icon;
