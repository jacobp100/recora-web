import React from 'react';
import classnames from 'classnames';
import { Link } from 'react-router';
import {
  stackContainer, container, horizontalContainer, stackIcon, stackLabel, horizontalIcon,
  horizontalLabel,
} from '../../styles/header-button.css';
import * as base from '../../styles/base.css';

// FIXME: Duplication: there isn't a nice way to do this
// I put them all in the same file, because the CSS needs to be together

const stackClassName = classnames(
  stackContainer,
  container,
  base.activeOpacity
);

const horizontalClassName = classnames(
  horizontalContainer,
  container,
  base.activeOpacity
);

export const StackLink = ({ icon, text, to }) => (
  <Link className={stackClassName} to={to} >
    <span className={stackIcon}>
      <span className={`pe-7s-${icon}`} />
    </span>
    <span className={stackLabel}>{ text }</span>
  </Link>
);

export const HorizontalLink = ({ icon, text, to }) => (
  <Link className={horizontalClassName} to={to} >
    <span className={horizontalIcon}>
      <span className={`pe-7s-${icon}`} />
    </span>
    <span className={horizontalLabel}>{ text }</span>
  </Link>
);

export const StackButton = ({ icon, text, onClick }) => (
  <button className={stackClassName} onClick={onClick}>
    <span className={stackIcon}>
      <span className={`pe-7s-${icon}`} />
    </span>
    <span className={stackLabel}>{ text }</span>
  </button>
);

export const HorizontalButton = ({ icon, text, onClick }) => (
  <button className={horizontalClassName} onClick={onClick}>
    <span className={horizontalIcon}>
      <span className={`pe-7s-${icon}`} />
    </span>
    <span className={horizontalLabel}>{ text }</span>
  </button>
);
