import React from 'react';
import popup from '../../styles/popup.css';
import base from '../../styles/base.css';

export default class SettingsPopup extends React.Component {
  constructor({ config }) {
    super();
    this.state = config;
  }
  render() {
    const { onDeleteDocument, onClose } = this.props;

    return (
      <div className={popup.container}>
        <div className={popup.popup}>
          <h1 className={popup.title}>Settings</h1>
          <h2 className={popup.heading}>Delete Document</h2>
          <p>
            Permanently deletes the document, and cannot be undone.
          </p>
          <button className={base.button} onClick={onDeleteDocument}>
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
  }
}
