import { map, prop } from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import Section from './Section';
import { container, title } from '../../styles/page.css';

const Page = ({ documentId, title, sections }) => (
  <div className={container}>
    <h1 className={title}>{ title }</h1>
    {
      map(sectionId => (
        <Section
          key={sectionId}
          documentId={documentId}
          sectionId={sectionId}
        />
      ), sections)
    }
  </div>
);

export default connect(
  ({ documentTitles, documentSections }, { documentId }) => ({
    title: prop(documentId, documentTitles || {}),
    sections: prop(documentId, documentSections || {}),
  }),
  null,
  null,
  { pure: true }
)(Page);
