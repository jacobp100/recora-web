// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { map, getOr, propertyOf, range, flow, pullAt, curry } from 'lodash/fp';
import PopoverItem from './PopoverItem';
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

  render() {
    const { sections } = this.props;
    const { order } = this.state;

    const reorderedSections = map(propertyOf(sections), order);

    const items = map(index => (
      <PopoverItem
        key={order[index]}
        index={index}
        text={reorderedSections[index]}
        reorder={this.reorder}
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
