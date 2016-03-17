import React from 'react';
import { map, addIndex, prop, partial } from 'ramda';
import { connect } from 'react-redux';
import ReactReorderable from 'react-reorderable';
import classnames from 'classnames';
import Popover from './Popover';
import SectionsPopoverItem from './SectionsPopoverItem';
import {
  addSection, setSectionTitle, deleteSection, reorderSections,
} from '../actions';
import * as sectionsPopover from '../../styles/sections-popover.css';
import * as base from '../../styles/base.css';


const getElementKeys = map(prop('key'));

const SectionsPopover = ({
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
  const onDrop = (order) => reorderSections(getElementKeys(order));

  const sectionElements = addIndex(map)((sectionId, index) => (
    <SectionsPopoverItem
      key={sectionId}
      title={sectionTitles[sectionId]}
      index={index}
      onSetTitle={partial(setSectionTitle, [sectionId])}
      onDelete={partial(deleteSection, [sectionId])}
    />
  ), sections);

  return (
    <Popover top={top} left={left} width={300} onClose={onClose}>
      <button
        className={classnames(base.button, base.buttonBlock)}
        onClick={addSection}
      >
        Add Section
      </button>
      <div className={sectionsPopover.sectionsContainer}>
        <ReactReorderable onDrop={onDrop}>
          { sectionElements }
        </ReactReorderable>
      </div>
      <p className={sectionsPopover.details}>
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
    addSection: () =>
      dispatch(addSection(documentId)),
    setSectionTitle: (sectionId, title) =>
      dispatch(setSectionTitle(sectionId, title)),
    deleteSection: (sectionId) =>
      dispatch(deleteSection(documentId, sectionId)),
    reorderSections: (orderedSectionIds) =>
      dispatch(reorderSections(documentId, orderedSectionIds)),
  }),
  null,
  { pure: true }
)(SectionsPopover);
