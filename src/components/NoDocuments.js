// @flow
import React from 'react';
import classnames from 'classnames';
import { title, body, button } from '../../styles/no-documents.css';
import { activeOpacity } from '../../styles/base.css';

const NoDocuments = ({ onAddDocument }) => (
  <div>
    <h1 className={title}>No Documents</h1>
    <p className={body}>
      Click
      <button
        className={classnames(button, activeOpacity)}
        onClick={onAddDocument}
      >
        <span className="pe-7s-file" />
        &nbsp;New Document
      </button>
      to get started
    </p>
  </div>
);

export default NoDocuments;
