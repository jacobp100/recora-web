import { partial, anyPass as juxt } from 'ramda';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { deleteDocument } from '../actions';
import {
  container, popup, title, heading, buttonGroup, button as popupButton,
} from '../../styles/popup.css';
import { button } from '../../styles/base.css';

const SettingsPopup = ({ documentId, deleteDocument, push, onClose }, { router }) => (
  <div className={container}>
    <div className={popup}>
      <h1 className={title}>Settings</h1>
      <h2 className={heading}>Delete Document</h2>
      <p>
        Permanently deletes the document, and cannot be undone.
      </p>
      <button
        className={button}
        onClick={juxt([
          partial(deleteDocument, [documentId]),
          () => router.push('/'),
        ])}
      >
        Delete Document
      </button>
      <div className={buttonGroup}>
        <button className={popupButton} onClick={partial(onClose, [documentId])}>
          Close
        </button>
      </div>
    </div>
  </div>
);
SettingsPopup.contextTypes = {
  router: PropTypes.object,
};

export default connect(
  null,
  { deleteDocument },
  null,
  { pure: true }
)(SettingsPopup);
