// @flow
import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { map, range, flow, pullAt, curry } from 'lodash/fp';
import SortableItem from './SortableItem';

const insertAt = curry((index, value, array) => (
  [].concat(
    array.slice(0, index),
    value,
    array.slice(index)
  )
));

class PopoverContainer extends Component {
  constructor({ rows }) {
    super();
    const order = range(0, rows.length);
    this.state = { order };
  }

  state: { order: number[] }

  componentWillReceiveProps(nextProps) {
    if (nextProps.rows !== this.props.rows || nextProps.rowTitles !== this.props.rowTitles) {
      const order = range(0, nextProps.rows.length);
      this.setState({ order });
    }
  }

  reorder = (dragIndex, hoverIndex) => {
    this.setState(state => {
      const sectionIndex = state.order[dragIndex];

      const order = flow(
        pullAt(dragIndex),
        insertAt(hoverIndex, sectionIndex)
      )(state.order);

      return { order };
    });
  }

  dragEnd = () => {
    this.props.onReorder(this.state.order);
  }

  render() {
    const { rows, rowTitles, onReorder, onDelete, onChangeTitle } = this.props;
    const { order } = this.state;

    const canDelete = Boolean(onDelete);
    const canReorder = Boolean(onReorder);

    const itemElements = map(index => {
      const sectionIndex = order[index];
      const row = rows[sectionIndex];
      const title = rowTitles[row];

      return (
        <SortableItem
          key={sectionIndex}
          canDelete={canDelete}
          canReorder={canReorder}
          index={index}
          sectionIndex={sectionIndex}
          id={row}
          title={title}
          onReorder={this.reorder}
          onDragEnd={this.dragEnd}
          onDelete={onDelete}
          onChangeTitle={onChangeTitle}
        />
      );
    }, range(0, rows.length));

    return (
      <div>
        {itemElements}
      </div>
    );
  }
}

/* eslint-disable new-cap */
export default DragDropContext(HTML5Backend)(PopoverContainer);
