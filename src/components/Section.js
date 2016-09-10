import { prop } from 'ramda';
import React from 'react';
import TextView from './TextView';
import TotalRow from './TotalRow';
import { connect } from 'react-redux';
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
    title: prop(sectionId, sectionTitles || {}),
    entries: prop(sectionId, sectionEntries || {}),
    totals: prop(sectionId, sectionTotals || {}),
  }),
  null,
  null,
  { pure: true }
)(Section);
