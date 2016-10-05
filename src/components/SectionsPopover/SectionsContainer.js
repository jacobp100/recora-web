// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { map, getOr, range, flow, pullAt, curry } from 'lodash/fp';
import SectionsItem from './SectionsItem';
import { reorderSections } from '../../redux';

const insertAt = curry((index, value, array) => (
  [].concat(
    array.slice(0, index),
    value,
    array.slice(index)
  )
));

class PopoverContainer extends Component {
  constructor({ sections }) {
    super();
    const order = range(0, sections.length);
    this.state = { order };
  }

  state: { order: number[] }

  componentWillReceiveProps(nextProps) {
    if (nextProps.sections !== this.props.sections) {
      const order = range(0, nextProps.sections.length);
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
    this.props.reorderSections(this.state.order);
  }

  render() {
    const { sections } = this.props;
    const { order } = this.state;

    const items = map(index => (
      <SectionsItem
        key={order[index]}
        index={index}
        sectionIndex={order[index]}
        sectionId={sections[order[index]]}
        onReorder={this.reorder}
        onDragEnd={this.dragEnd}
      />
    ), range(0, sections.length));

    return (
      <div>
        {items}
      </div>
    );
  }
}

/* eslint-disable new-cap */
export default flow(
  DragDropContext(HTML5Backend),
  connect(
    (state, { documentId }) => ({
      sections: getOr([], ['documentSections', documentId], state),
    }),
    (dispatch, { documentId }) => ({
      reorderSections: order => dispatch(reorderSections(documentId, order)),
    })
  )
)(PopoverContainer);