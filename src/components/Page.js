// @flow
import { map, get } from 'lodash/fp';
import React from 'react';
import { connect } from 'react-redux';
import Section from './Section';
import { container, title } from '../../styles/page.css';

const Page = ({ documentTitle, sections }) => (
  <div className={container}>
    <h1 className={title}>{documentTitle}</h1>
    {
      map(sectionId => (
        <Section
          key={sectionId}
          sectionId={sectionId}
        />
      ), sections)
    }
  </div>
);

export default connect(
  ({ documentTitles, documentSections }, { documentId }) => ({
    documentTitle: get(documentId, documentTitles),
    sections: get(documentId, documentSections),
  })
)(Page);
