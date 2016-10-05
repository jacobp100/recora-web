// @flow
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
// import { map } from 'lodash/fp';
import { Link } from 'react-router';
import { TweenState } from 'state-transitions';
import classnames from 'classnames';
import { container, /* section, */ page, title } from '../../styles/document-preview.css';
import { activeOpacity } from '../../styles/base.css';

const DocumentPreview = ({ documentId, documentTitle }) => {
  // const sectionElements = map(sectionId => (
  //   <span
  //     key={sectionId}
  //     className={section}
  //     style={{ height: sectionTextInputs[sectionId].length + 1 }}
  //   />
  // ), sections);
  const sectionElements = null;

  const linkClassName = classnames(container, activeOpacity);

  return (
    <Link className={linkClassName} to={`/${documentId}`}>
      <TweenState id={`doc-${documentId}`}>
        <span className={page}>
          {sectionElements}
        </span>
      </TweenState>
      <span className={title}>
        {documentTitle}
      </span>
    </Link>
  );
};

DocumentPreview.propTypes = {
  documentId: PropTypes.string,
  documentTitle: PropTypes.string,
};

export default connect(
  ({ documents, documentTitles, documentSections, sectionTextInputs }, { documentId }) => ({
    documentTitle: documentTitles[documentId],
  })
)(DocumentPreview);
