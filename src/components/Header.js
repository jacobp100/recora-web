// @flow
import React from 'react';
import classnames from 'classnames';
import { container, section, left, right, center } from '../../styles/header.css';

const headerPositions = { left, right, center };

export const Header = ({ children }) => (
  <div className={container}>
    { children }
  </div>
);

export const HeaderSection = ({ place, children }) => (
  <div className={classnames(section, headerPositions[place])}>
    { children }
  </div>
);
