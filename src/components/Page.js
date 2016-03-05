import React, { PropTypes } from 'react';
import { map } from 'ramda';
import Section from './Section';
import * as page from '../../styles/page.css';

export default function Page({
  title,
  sections,
  sectionTitles,
  sectionTextInputs,
  sectionEntries,
  sectionTotalTexts,
  setTextInputs,
}) {
  return (
    <div className={page.container}>
      <h1 className={page.title}>{ title }</h1>
      {
        map(sectionId => (
          <Section
            key={sectionId}
            title={sectionTitles[sectionId]}
            textInputs={sectionTextInputs[sectionId]}
            entries={sectionEntries[sectionId]}
            total={sectionTotalTexts[sectionId]}
            onChange={setTextInputs(sectionId)}
          />
        ), sections)
      }
    </div>
  );
}
Page.propTypes = {
  title: PropTypes.string,
  sections: PropTypes.array,
  sectionTextInputs: PropTypes.object,
  sectionEntries: PropTypes.object,
  sectionTotalTexts: PropTypes.object,
  setTextInputs: PropTypes.func,
};
