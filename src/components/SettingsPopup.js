import { partial, anyPass as juxt } from 'ramda';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { deleteDocument } from '../actions';
import popup from '../../styles/popup.css';
import base from '../../styles/base.css';

const SettingsPopup = ({ documentId, deleteDocument, push, onClose }, { router }) => (
  <div className={popup.container}>
    <div className={popup.popup}>
      <h1 className={popup.title}>Settings</h1>
      <h2 className={popup.heading}>Delete Document</h2>
      <p>
        Permanently deletes the document, and cannot be undone.
      </p>
      <button
        className={base.button}
        onClick={juxt([
          partial(deleteDocument, [documentId]),
          () => router.push('/'),
        ])}
      >
        Delete Document
      </button>
      <div className={popup.buttonGroup}>
        <button className={popup.button} onClick={partial(onClose, [documentId])}>
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
