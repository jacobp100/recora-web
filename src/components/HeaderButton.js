// @flow
import React, { PropTypes } from 'react';
import classnames from 'classnames';
import { Link } from 'react-router';
import {
  stackContainer, horizontalContainer, container, stackIcon, stackLabel, horizontalIcon,
  horizontalLabel,
} from '../../styles/header-button.css';
import * as base from '../../styles/base.css';

// FIXME: Duplication: there isn't a nice way to do this
// I put them all in the same file, because the CSS needs to be together

const STACK = 'stack';
const HORIZONTAL = 'horizontal';

const containerStyles = {
  [STACK]: classnames(
    stackContainer,
    container,
    base.activeOpacity
  ),
  [HORIZONTAL]: classnames(
    horizontalContainer,
    container,
    base.activeOpacity
  ),
};

const iconStyles = {
  [STACK]: stackIcon,
  [HORIZONTAL]: horizontalIcon,
};

const labelStyles = {
  [STACK]: stackLabel,
  [HORIZONTAL]: horizontalLabel,
};

const Item = ({ component: Component, styleName, props, icon, text }) => (
  <Component className={containerStyles[styleName]} {...props} >
    <span className={iconStyles[styleName]}>
      <span className={`pe-7s-${icon}`} />
    </span>
    <span className={labelStyles[styleName]}>{text}</span>
  </Component>
);

const linkPropTypes = {
  icon: PropTypes.string,
  text: PropTypes.string,
  to: PropTypes.string,
};

const buttonPropTypes = {
  icon: PropTypes.string,
  text: PropTypes.string,
  onClick: PropTypes.func,
};

export const StackLink = ({ icon, text, to }: Object) => (
  <Item component={Link} styleName={STACK} props={{ to }} icon={icon} text={text} />
);
StackLink.propTypes = linkPropTypes;

export const HorizontalLink = ({ icon, text, to }: Object) => (
  <Item component={Link} styleName={HORIZONTAL} props={{ to }} icon={icon} text={text} />
);
HorizontalLink.propTypes = linkPropTypes;

export const StackButton = ({ icon, text, onClick }: Object) => (
  <Item component={'button'} styleName={STACK} props={{ onClick }} icon={icon} text={text} />
);
StackButton.propTypes = buttonPropTypes;

export const HorizontalButton = ({ icon, text, onClick }: Object) => (
  <Item component={'button'} styleName={HORIZONTAL} props={{ onClick }} icon={icon} text={text} />
);
HorizontalButton.propTypes = buttonPropTypes;
