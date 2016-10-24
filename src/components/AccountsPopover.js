// @flow
import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Popover from './Popover';
import SortableList from './SortableList';
// import {  } from '../redux';
import { sectionsContainer, details } from '../../styles/sections-popover.css';
import { button, buttonBlock } from '../../styles/base.css';


const SectionsPopover = ({
  top,
  left,
  accounts,
  accountNames,
  onAddAccount,
  onClose,
}) => (
  <Popover top={top} left={left} width={300} onClose={onClose}>
    <button className={classnames(button, buttonBlock)} onClick={onAddAccount}>
      Add Account
    </button>
    <div className={sectionsContainer}>
      <SortableList
        rows={accounts}
        rowTitles={accountNames}
        onDelete={() => {}}
      />
    </div>
    <p className={details}>
      Double click a section to change the title, drag and drop to rearrange
    </p>
  </Popover>
);

export default connect(
  ({ accounts, accountNames }) => ({
    accounts,
    accountNames,
  }),
  null // dispatch => ({
  // })
)(SectionsPopover);
