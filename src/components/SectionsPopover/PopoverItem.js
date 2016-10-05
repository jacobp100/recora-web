// @flow
import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { flow, get, equals, cond } from 'lodash/fp';
import { DragSource, DropTarget } from 'react-dnd';
import { setSectionTitle, deleteSection } from '../../redux';
import { itemEdit, item, dragging, deleteIcon } from '../../../styles/sections-popover.css';


const TITLE_TYPE = 'title';

// https://github.com/gaearon/react-dnd/blob/master/examples/04%20Sortable/Simple/Card.js
const cardSource = {
  beginDrag: props => ({ id: props.id, index: props.index }),
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

    props.reorder(dragIndex, hoverIndex);
    monitor.getItem().index = hoverIndex; // eslint-disable-line
  },
};


class SectionsPopoverItem extends Component {
  constructor({ title }: { title: string }) {
    super();
    this.state = { title, isEditing: false };
  }

  state: { title: string, isEditing: bool }

  onInput = ({ target }: Object) => this.setState({ title: target.value });
  onKeyDown = ({ keyCode }: Object) => cond([
    // enter
    [equals(13), () => {
      this.props.onSetTitle(this.state.title);
      this.setState({ isEditing: false });
    }],
    // escape
    [equals(27), () => { this.setState({ isEditing: false }); }],
  ])(keyCode);
  toggleEditing = () => { this.setState({ isEditing: !this.state.isEditing }); };

  render() {
    const { index, onDelete, isDragging, connectDragSource, connectDropTarget } = this.props;
    const { title, isEditing } = this.state;

    if (isEditing) {
      return (
        <input
          className={itemEdit}
          value={title}
          type="text"
          onKeyDown={this.onKeyDown}
          onInput={this.onInput}
          autoFocus
        />
      );
    }

    return connectDragSource(connectDropTarget(
      <div className={classnames(item, isDragging && dragging)} onDoubleClick={this.toggleEditing}>
        {title || `Section ${index + 1}`}
        <button className={deleteIcon} onClick={onDelete}>
          <span className="pe-7s-trash" />
        </button>
      </div>
    ));
  }
}

/* eslint-disable new-cap */
export default flow(
  DropTarget(TITLE_TYPE, cardTarget, connect => ({
    connectDropTarget: connect.dropTarget(),
  })),
  DragSource(TITLE_TYPE, cardSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging(),
  })),
  connect(
    ({ sectionTitles }, { sectionId }) => ({
      sectionTitle: get(sectionId, sectionTitles),
    }),
    (dispatch, { sectionId }) => ({
      setSectionTitle: title => dispatch(setSectionTitle(sectionId, title)),
      deleteSection: () => dispatch(deleteSection(sectionId)),
    })
  )
)(SectionsPopoverItem);
