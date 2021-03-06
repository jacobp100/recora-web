// @flow
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { deleteDocument } from '../redux';
import {
  container, popup, title, heading, buttonGroup, button as popupButton,
} from '../../styles/popup.css';
import { button } from '../../styles/base.css';

const SettingsPopup = ({ deleteDocument, onClose }) => (
  <div className={container}>
    <div className={popup}>
      <h1 className={title}>Settings</h1>
      <h2 className={heading}>Delete Document</h2>
      <p>
        Permanently deletes the document, and cannot be undone.
      </p>
      <button className={button} onClick={deleteDocument}>
        Delete Document
      </button>
      <div className={buttonGroup}>
        <button className={popupButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
);

SettingsPopup.propTypes = {
  deleteDocument: PropTypes.func,
  onClose: PropTypes.func,
};

export default connect(
  null,
  (dispatch, { documentId }) => ({
    deleteDocument: () => dispatch(deleteDocument(documentId)),
  }),
)(SettingsPopup);
