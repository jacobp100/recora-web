// @flow
import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Popover from '../Popover';
import SectionsContainer from './SectionsContainer';
import { addSection } from '../../redux';
import { sectionsContainer, details } from '../../../styles/sections-popover.css';
import { button, buttonBlock } from '../../../styles/base.css';

  // const sectionElements = addIndex(map)((sectionId, index) => (
  //   <PopoverItem
  //     key={sectionId}
  //     title={sectionTitles[sectionId]}
  //     index={index}
  //     onSetTitle={partial(setSectionTitle, [sectionId])}
  //     onDelete={partial(deleteSection, [documentId, sectionId])}
  //   />
  // ), sections);

const SectionsPopover = ({
  top,
  left,
  documentId,
  addSection,
  onClose,
}) => (
  <Popover top={top} left={left} width={300} onClose={onClose}>
    <button className={classnames(button, buttonBlock)} onClick={addSection}>
      Add Section
    </button>
    <div className={sectionsContainer}>
      <SectionsContainer documentId={documentId} />
    </div>
    <p className={details}>
      Double click a section to change the title, drag and drop to rearrange
    </p>
  </Popover>
);

export default connect(
  null,
  (dispatch, { documentId }) => ({
    addSection: () => dispatch(addSection(documentId)),
  })
)(SectionsPopover);
