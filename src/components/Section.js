import React from 'react';
import TextView from './TextView';
import TotalRow from './TotalRow';
import * as section from '../../styles/section.css';

export default function Section({ textInputs, entries, total, onChange }) {
  const totalElement = total && <TotalRow ready={Boolean(entries)} total={total} />;

  return (
    <div>
      <h2 className={section.title}>
        Title
      </h2>
      <TextView textInputs={textInputs} entries={entries} onChange={onChange} />
      { totalElement }
    </div>
  );
}
