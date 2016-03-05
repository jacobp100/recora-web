import React, { PropTypes } from 'react';
import { map } from 'ramda';
import { Link } from 'react-router';
import { TweenState } from 'state-transitions';
import classnames from 'classnames';
import * as documentPreview from '../../styles/document-preview.css';
import * as base from '../../styles/base.css';

export default function DocumentPreview({ id, title, sections, sectionTextInputs }) {
  const sectionElements = map(sectionId => (
    <span
      key={sectionId}
      className={documentPreview.section}
      style={{ height: sectionTextInputs[sectionId].length + 1 }}
    />
  ), sections);

  const linkClassName = classnames(documentPreview.container, base.activeOpacity);

  return (
    <Link className={linkClassName} key={id} to={`/${id}`}>
      <TweenState id={`doc-${id}`}>
        <span className={documentPreview.page}>
          { sectionElements }
        </span>
      </TweenState>
      <span className={documentPreview.title}>
        { title }
      </span>
    </Link>
  );
}
DocumentPreview.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  sections: PropTypes.array,
  sectionTextInputs: PropTypes.object,
};
