// @flow
import React, { PropTypes } from 'react';
import { map } from 'lodash/fp';
import { Link } from 'react-router';
import { TweenState } from 'state-transitions';
import classnames from 'classnames';
import { container, section, page, title } from '../../styles/document-preview.css';
import { activeOpacity } from '../../styles/base.css';

const DocumentPreview = ({ documentId, title, sections, sectionTextInputs }) => {
  const sectionElements = map(sectionId => (
    <span
      key={sectionId}
      className={section}
      style={{ height: sectionTextInputs[sectionId].length + 1 }}
    />
  ), sections);

  const linkClassName = classnames(container, activeOpacity);

  return (
    <Link className={linkClassName} key={documentId} to={`/${documentId}`}>
      <TweenState id={`doc-${documentId}`}>
        <span className={page}>
          { sectionElements }
        </span>
      </TweenState>
      <span className={title}>
        {title}
      </span>
    </Link>
  );
};

DocumentPreview.propTypes = {
  documentId: PropTypes.string,
  title: PropTypes.string,
  sections: PropTypes.array,
  sectionTextInputs: PropTypes.object,
};

export default DocumentPreview;
