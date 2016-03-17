import React from 'react';
import classnames from 'classnames';
import * as noDocuments from '../../styles/no-documents.css';
import * as base from '../../styles/base.css';

const NoDocuments = ({ onAddDocument }) => (
  <div>
    <h1 className={noDocuments.title}>No Documents</h1>
    <p className={noDocuments.body}>
      Click
      <button
        className={classnames(noDocuments.button, base.activeOpacity)}
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
