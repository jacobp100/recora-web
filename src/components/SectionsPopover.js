// @flow
import React from 'react';
import { map, addIndex, prop, partial } from 'lodash/fp';
import { connect } from 'react-redux';
import ReactReorderable from 'react-reorderable';
import classnames from 'classnames';
import Popover from './Popover';
import SectionsPopoverItem from './SectionsPopoverItem';
import {
  addSection, setSectionTitle, deleteSection, reorderSections,
} from '../redux';
import { sectionsContainer, details } from '../../styles/sections-popover.css';
import { button, buttonBlock } from '../../styles/base.css';


const getElementKeys = map(prop('key'));

const SectionsPopover = ({
  documentId,
  top,
  left,
  sections,
  sectionTitles,
  addSection,
  setSectionTitle,
  deleteSection,
  reorderSections,
  onClose,
}) => {
  const onDrop = (order) => reorderSections(documentId, getElementKeys(order));

  const sectionElements = addIndex(map)((sectionId, index) => (
    <SectionsPopoverItem
      key={sectionId}
      title={sectionTitles[sectionId]}
      index={index}
      onSetTitle={partial(setSectionTitle, [sectionId])}
      onDelete={partial(deleteSection, [documentId, sectionId])}
    />
  ), sections);

  return (
    <Popover top={top} left={left} width={300} onClose={onClose}>
      <button
        className={classnames(button, buttonBlock)}
        onClick={partial(addSection, [documentId])}
      >
        Add Section
      </button>
      <div className={sectionsContainer}>
        <ReactReorderable onDrop={onDrop}>
          { sectionElements }
        </ReactReorderable>
      </div>
      <p className={details}>
        Double click a section to change the title, drag and drop to rearrange
      </p>
    </Popover>
  );
};

export default connect(
  ({ documentSections, sectionTitles }, { documentId }) => ({
    sections: prop(documentId, documentSections || {}),
    sectionTitles,
  }),
  (dispatch, { documentId }) => ({
    addSection: () => dispatch(addSection(documentId)),
    setSectionTitle: (sectionId, title) => dispatch(setSectionTitle(sectionId, title)),
    deleteSection: (sectionId) => dispatch(deleteSection(sectionId)),
    reorderSections: () => dispatch(reorderSections()),
  })
)(SectionsPopover);
