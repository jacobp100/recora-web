// @flow
import React, { PropTypes } from 'react';
import classnames from 'classnames';
import { Link } from 'react-router';
import Icon from './Icon';
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

const Item = ({ component: Component, variant, props, iconName, text }) => (
  <Component className={containerStyles[variant]} {...props} >
    <span className={iconStyles[variant]}>
      <Icon iconName={iconName} />
    </span>
    <span className={labelStyles[variant]}>{text}</span>
  </Component>
);

const linkPropTypes = {
  iconName: PropTypes.string,
  text: PropTypes.string,
  to: PropTypes.string,
};

const buttonPropTypes = {
  iconName: PropTypes.string,
  text: PropTypes.string,
  onClick: PropTypes.func,
};

export const StackLink = ({ iconName, text, to }: Object) => (
  <Item component={Link} variant={STACK} props={{ to }} iconName={iconName} text={text} />
);
StackLink.propTypes = linkPropTypes;

export const HorizontalLink = ({ iconName, text, to }: Object) => (
  <Item component={Link} variant={HORIZONTAL} props={{ to }} iconName={iconName} text={text} />
);
HorizontalLink.propTypes = linkPropTypes;

export const StackButton = ({ iconName, text, onClick }: Object) => (
  <Item component={'button'} variant={STACK} props={{ onClick }} iconName={iconName} text={text} />
);
StackButton.propTypes = buttonPropTypes;

export const HorizontalButton = ({ iconName, text, onClick }: Object) => (
  <Item component={'button'} variant={HORIZONTAL} props={{ onClick }} iconName={iconName} text={text} />
);
HorizontalButton.propTypes = buttonPropTypes;
