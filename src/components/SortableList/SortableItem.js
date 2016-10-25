// @flow
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import classnames from 'classnames';
import { flow, equals, cond } from 'lodash/fp';
import { DragSource, DropTarget } from 'react-dnd';
import Icon from '../Icon';
import { itemEdit, item, target, dragging, deleteIcon } from '../../../styles/sections-popover.css';


const TITLE_TYPE = 'title';

// https://github.com/gaearon/react-dnd/blob/master/examples/04%20Sortable/Simple/Card.js
const cardSource = {
  beginDrag: props => ({ id: props.id, index: props.index }),
  endDrag: (props, monitor) => { if (monitor.didDrop) props.onDragEnd(); },
};

/* eslint-disable react/no-find-dom-node */
const cardTarget = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    if (dragIndex === hoverIndex) return;

    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
    const clientOffset = monitor.getClientOffset();
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

    props.onReorder(dragIndex, hoverIndex);
    monitor.getItem().index = hoverIndex; // eslint-disable-line
  },
};


class SectionsPopoverItem extends Component {
  constructor({ title }: { title: string }) {
    super();
    this.state = { title, isEditing: false };
  }

  state: { title: string, isEditing: bool }

  onChange = ({ target }: Object) => this.setState({ title: target.value });
  onKeyDown = ({ keyCode }: Object) => cond([
    // enter
    [equals(13), () => {
      if (this.props.onChangeTitle) this.props.onChangeTitle(this.props.id, this.state.title);
      this.stopEditing();
    }],
    // escape
    [equals(27), () => { this.stopEditing(); }],
  ])(keyCode)
  onDelete = () => { if (this.props.onDelete) this.props.onDelete(this.props.id); }
  onClick = () => { if (this.props.onClick) this.props.onClick(this.props.id); }
  stopEditing = () => { this.setState({ isEditing: false }); }
  toggleEditing = () => { this.setState({ isEditing: !this.state.isEditing }); }


  render() {
    const {
      canReorder, canDelete, canDrop, isDragging, connectDragSource, connectDropTarget,
    } = this.props;
    const { title, isEditing } = this.state;

    if (isEditing) {
      return (
        <input
          className={itemEdit}
          value={title}
          type="text"
          onKeyDown={this.onKeyDown}
          onChange={this.onChange}
          onBlur={this.stopEditing}
          autoFocus
        />
      );
    }

    /* eslint-disable jsx-a11y/no-static-element-interactions */
    const element = (
      <div
        role="button"
        className={classnames(item, canDrop && target, isDragging && dragging)}
        onClick={this.onClick}
        onDoubleClick={this.toggleEditing}
      >
        {title}
        {canDelete && <button className={deleteIcon} onClick={this.onDelete}>
          <Icon iconName="trash" />
        </button>}
      </div>
    );
    /* eslint-enable */

    return canReorder
      ? connectDragSource(connectDropTarget(element))
      : element;
  }
}

/* eslint-disable new-cap */
export default flow(
  DropTarget(TITLE_TYPE, cardTarget, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    hasDrag: monitor.isOver(),
    canDrop: monitor.canDrop(),
  })),
  DragSource(TITLE_TYPE, cardSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  })),
)(SectionsPopoverItem);
