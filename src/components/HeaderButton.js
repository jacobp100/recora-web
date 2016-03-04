import React from 'react';
import classnames from 'classnames';
import { Link } from 'react-router';
import * as headerButton from '../../styles/header-button.css';
import * as base from '../../styles/base.css';

// FIXME: Duplication: there isn't a nice way to do this
// I put them all in the same file, because the CSS needs to be together

const stackClassName = classnames(
  headerButton.stackContainer,
  headerButton.container,
  base.activeOpacity
);

const horizontalClassName = classnames(
  headerButton.horizontalContainer,
  headerButton.container,
  base.activeOpacity
);

export function StackLink({ icon, text, to }) {
  return (
    <Link className={stackClassName} to={to} >
      <span className={headerButton.stackIcon}>
        <span className={`pe-7s-${icon}`} />
      </span>
      <span className={headerButton.stackLabel}>{ text }</span>
    </Link>
  );
}

export function HorizontalLink({ icon, text, to }) {
  return (
    <Link className={horizontalClassName} to={to} >
      <span className={headerButton.horizontalIcon}>
        <span className={`pe-7s-${icon}`} />
      </span>
      <span className={headerButton.horizontalLabel}>{ text }</span>
    </Link>
  );
}

export function StackButton({ icon, text, onClick }) {
  return (
    <button className={stackClassName} onClick={onClick}>
      <span className={headerButton.stackIcon}>
        <span className={`pe-7s-${icon}`} />
      </span>
      <span className={headerButton.stackLabel}>{ text }</span>
    </button>
  );
}

export function HorizontalButton({ icon, text, onClick }) {
  return (
    <button className={horizontalClassName} onClick={onClick}>
      <span className={headerButton.horizontalIcon}>
        <span className={`pe-7s-${icon}`} />
      </span>
      <span className={headerButton.horizontalLabel}>{ text }</span>
    </button>
  );
}
