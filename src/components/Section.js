// @flow
import { get } from 'lodash/fp';
import React from 'react';
import { connect } from 'react-redux';
import TextView from './TextView';
import TotalRow from './TotalRow';
import { title, container } from '../../styles/section.css';

const Section = ({ sectionId, sectionTitle, sectionResults, sectionTotal }) => {
  const ready = Boolean(sectionResults);
  const totalElement = sectionTotal && <TotalRow ready={ready} total={sectionTotal} />;

  const titleElement = sectionTitle && (
    <h2 className={title}>
      {sectionTitle}
    </h2>
  );

  return (
    <div className={container}>
      {titleElement}
      <TextView sectionId={sectionId} />
      {totalElement}
    </div>
  );
};

export default connect(
  ({ sectionTitles, sectionResults, sectionTotals }, { sectionId }) => ({
    sectionTitle: get(sectionId, sectionTitles),
    sectionResults: get(sectionId, sectionResults),
    sectionTotal: get(sectionId, sectionTotals),
  }),
  null,
  null,
  { pure: true }
)(Section);
