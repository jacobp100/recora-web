import React from 'react';
import { map, addIndex, prop, partial } from 'ramda';
import ReactReorderable from 'react-reorderable';
import classnames from 'classnames';
import Popover from './Popover';
import SectionsPopoverItem from './SectionsPopoverItem';
import * as sectionsPopover from '../../styles/sections-popover.css';
import * as base from '../../styles/base.css';


const getElementKeys = map(prop('key'));

export default class SectionsPopover extends React.Component {
  render() {
    const {
      top, left, sections, sectionTitles, onAddSection, onRenameSection, onClose,
    } = this.props;
    const onDrop = (order) => (this.props.onReorderSections(getElementKeys(order)));

    const sectionElements = addIndex(map)((sectionId, index) => (
      <SectionsPopoverItem
        key={sectionId}
        title={sectionTitles[sectionId]}
        index={index}
        onSetTitle={partial(onRenameSection, [sectionId])}
      />
    ), sections);

    return (
      <Popover top={top} left={left} width={300} onClose={onClose}>
        <button
          className={classnames(base.button, base.buttonBlock)}
          onClick={onAddSection}
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
  }
}
