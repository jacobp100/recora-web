import React, { PropTypes } from 'react';
import { AnimateInOut } from 'state-transitions';
import classnames from 'classnames';
import * as popover from '../../styles/popover.css';

// Can't use CSSTransitionGroup as a container to all popovers
// Switching from one popover to another hid the second one
// Even doing each popover in its own CSSTransitionGroup did the same
export default class Popover extends React.Component {
  constructor() {
    super();
    this.handleDocumentClick = (e) => {
      if (!this.refs.container.contains(e.target)) {
        this.props.onClose();
      }
    };
  }
  componentWillMount() {
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  render() {
    const { top, width, popoverMargin, children } = this.props;
    let { left } = this.props;

    const originalLeft = left;
    // using box-sizing: border-box
    const maxLeft = document.body.offsetWidth - width - popoverMargin;

    if (left > maxLeft) {
      left = maxLeft;
    } else if (left < popoverMargin + width / 2) {
      left = popoverMargin;
    } else {
      left = left - width / 2;
    }

    const arrowLeft = originalLeft - left;

    return (
      <AnimateInOut animateOutClassName={popover.popoverLeaving}>
        <div
          ref="container"
          key={`${top}:${left}`}
          className={classnames(popover.container, popover.top)}
          style={{ top, left, width }}
        >
          <div className={popover.arrowTop} style={{ left: arrowLeft }} />
          <div className={popover.content} width={width}>
            { children }
          </div>
        </div>
      </AnimateInOut>
    );
  }
}
Popover.propTypes = {
  top: PropTypes.number,
  left: PropTypes.number,
  width: PropTypes.number,
  popoverMargin: PropTypes.number,
  onClose: PropTypes.func,
};
Popover.defaultProps = {
  popoverMargin: 12,
};
