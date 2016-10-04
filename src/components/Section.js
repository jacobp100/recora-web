// @flow
import { get } from 'lodash/fp';
import React from 'react';
import { connect } from 'react-redux';
import TextView from './TextView';
import TotalRow from './TotalRow';
import { title, container } from '../../styles/section.css';

const Section = ({ sectionId, documentId, title, entries, total }) => {
  const totalElement = total && <TotalRow ready={Boolean(entries)} total={total} />;

  const titleElement = title && (
    <h2 className={title}>
      { title }
    </h2>
  );

  return (
    <div className={container}>
      { titleElement }
      <TextView documentId={documentId} sectionId={sectionId} />
      { totalElement }
    </div>
  );
};

export default connect(
  ({ sectionTitles, sectionEntries, sectionTotals }, { sectionId }) => ({
    title: get(sectionId, sectionTitles),
    entries: get(sectionId, sectionEntries),
    totals: get(sectionId, sectionTotals),
  }),
  null,
  null,
  { pure: true }
)(Section);
