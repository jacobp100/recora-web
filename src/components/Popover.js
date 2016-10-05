// @flow
/* global document */
import React, { Component, PropTypes } from 'react';
import { AnimateInOut } from 'state-transitions';
import classnames from 'classnames';
import {
  popoverLeaving, container, arrowTop, content, top as popoverTop,
} from '../../styles/popover.css';

// Can't use CSSTransitionGroup as a container to all popovers
// Switching from one popover to another hid the second one
// Even doing each popover in its own CSSTransitionGroup did the same
export default class Popover extends Component {
  static propTypes = {
    top: PropTypes.number,
    left: PropTypes.number,
    width: PropTypes.number,
    popoverMargin: PropTypes.number,
    onClose: PropTypes.func,
  }

  static defaultProps = {
    popoverMargin: 12,
  }

  componentWillMount() {
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  handleDocumentClick = (e: Object) => {
    if (this.container && !this.container.contains(e.target)) {
      this.props.onClose();
    }
  };

  container = null;

  render() {
    const { top, width, popoverMargin, children } = this.props;
    let { left } = this.props;

    const originalLeft = left;
    // using box-sizing: border-box
    const maxLeft = document.body.offsetWidth - width - popoverMargin;

    if (left > maxLeft) {
      left = maxLeft;
    } else if (left < popoverMargin + (width / 2)) {
      left = popoverMargin;
    } else {
      left = left - (width / 2); // eslint-disable-line
    }

    const arrowLeft = originalLeft - left;

    return (
      <AnimateInOut animateOutClassName={popoverLeaving}>
        <div
          ref={container => { this.container = container; }}
          key={`${top}:${left}`}
          className={classnames(container, popoverTop)}
          style={{ top, left, width }}
        >
          <div className={arrowTop} style={{ left: arrowLeft }} />
          <div className={content} width={width}>
            { children }
          </div>
        </div>
      </AnimateInOut>
    );
  }
}
