import React from 'react';
import TextView from './TextView';
import TotalRow from './TotalRow';
import * as section from '../../styles/section.css';

export default function Section({ title, textInputs, entries, total, onChange }) {
  const totalElement = total && <TotalRow ready={Boolean(entries)} total={total} />;

  const titleElement = title && (
    <h2 className={section.title}>
      { title }
    </h2>
  );

  return (
    <div>
      { titleElement }
      <TextView textInputs={textInputs} entries={entries} onChange={onChange} />
      { totalElement }
    </div>
  );
}
