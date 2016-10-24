// @flow
import React from 'react';
import { connect } from 'react-redux';
import { getOr } from 'lodash/fp';
import classnames from 'classnames';
import Popover from './Popover';
import SortableList from './SortableList';
import { addSection, deleteSection, setSectionTitle, reorderSections } from '../redux';
import { sectionsContainer, details } from '../../styles/sections-popover.css';
import { button, buttonBlock } from '../../styles/base.css';


const SectionsPopover = ({
  top,
  left,
  sections,
  sectionTitles,
  onClose,
  addSection,
  reorderSections,
  deleteSection,
  setSectionTitle,
}) => (
  <Popover top={top} left={left} width={300} onClose={onClose}>
    <button className={classnames(button, buttonBlock)} onClick={addSection}>
      Add Section
    </button>
    <div className={sectionsContainer}>
      <SortableList
        rows={sections}
        rowTitles={sectionTitles}
        onReorder={reorderSections}
        onDelete={deleteSection}
        onChangeTitle={setSectionTitle}
      />
    </div>
    <p className={details}>
      Double click a section to change the title, drag and drop to rearrange
    </p>
  </Popover>
);

export default connect(
  ({ documentSections, sectionTitles }, { documentId }) => ({
    sections: getOr([], documentId, documentSections),
    sectionTitles,
  }),
  (dispatch, { documentId }) => ({
    addSection: () => dispatch(addSection(documentId)),
    deleteSection: sectionId => dispatch(deleteSection(sectionId)),
    setSectionTitle: (sectionId, title) => dispatch(setSectionTitle(sectionId, title)),
    reorderSections: order => dispatch(reorderSections(documentId, order)),
  })
)(SectionsPopover);
