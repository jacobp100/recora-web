import React from 'react';
import { connect } from 'react-redux';
import { deleteDocument } from '../actions';
import popup from '../../styles/popup.css';
import base from '../../styles/base.css';

const SettingsPopup = ({ deleteDocument, onClose }) => (
  <div className={popup.container}>
    <div className={popup.popup}>
      <h1 className={popup.title}>Settings</h1>
      <h2 className={popup.heading}>Delete Document</h2>
      <p>
        Permanently deletes the document, and cannot be undone.
      </p>
      <button className={base.button} onClick={deleteDocument}>
        Delete Document
      </button>
      <div className={popup.buttonGroup}>
        <button className={popup.button} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
);

export default connect(
  null,
  (dispatch, { documentId }) => ({
    deleteDocument: () =>
      dispatch(deleteDocument(documentId)),
  }),
  null,
  { pure: true }
)(SettingsPopup);
