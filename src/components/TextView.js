// @flow
import { map, reduce, zip, last, concat, compact, get } from 'lodash/fp';
import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { setTextInputs } from '../redux';
import * as tagNames from '../../styles/tag-names.css';
import { container, textarea, entry, input, result } from '../../styles/text-view.css';


const SpanningElement = ({ result, start = 0, end = Infinity, type }) => (
  <span className={classnames('tag', tagNames[type])}>
    {result.text.substring(start, end)}
  </span>
);

const getSpanningElements = reduce(({ index, spanningElements }, { start, end, type }) => {
  const preKey = `pre-${start}`;
  const key = `${start}-${end}`;

  const newSpanningElements = compact([
    start !== index
      ? <SpanningElement key={preKey} result={result} start={index} end={start} />
      : null,
    <SpanningElement key={key} result={result} start={start} end={end} type={type} />,
  ]);

  return {
    index: end,
    spanningElements: spanningElements.concat(newSpanningElements),
  };
}, {
  index: 0,
  elements: 0,
});

const TextViewEntry = ({ result, text }) => {
  // Recora strips out some noop tags from the start, middle and end,
  // but we need to actually show that text.
  let resultTags = result.tags || [{ start: 0, end: result.text.length }];

  const lastEntryTag = last(resultTags);
  if (lastEntryTag.end !== text.length) {
    resultTags = concat(resultTags, { start: lastEntryTag.end, end: text.length });
  }

  const { spanningElements } = getSpanningElements(resultTags);

  return (
    <div className={entry}>
      <div className={input}>
        {spanningElements}
      </div>
      <div className={result}>
        {result.pretty}
      </div>
    </div>
  );
};

const TextView = ({ textInputs, results, setTextInputs }) => {
  const text = textInputs.join('\n');
  const resultsWithText = results || map(text => ({ text }), textInputs);

  let values = map(([entryText, result]) => (
    <TextViewEntry text={entryText} result={result} />
  ), zip(textInputs, resultsWithText));
  // Note above, if entries isn't ready yet, fake it with the text inputs (which will be ready)
  // This will mean that we'll see black text without results until entries is fully loaded, and
  // then it will adjust afterwards (without the page reflowing).

  if (text.length === 0) {
    const placeholderText = 'Type to begin calculation…';
    const placeholderEntry = {
      text: placeholderText,
      tags: [{
        type: 'placeholder',
        start: 0,
        end: placeholderText.length,
      }],
    };
    values = <TextViewEntry text={placeholderText} entry={placeholderEntry} />;
  }

  return (
    <div className={container}>
      <textarea
        className={textarea}
        value={text}
        onChange={setTextInputs}
      />
      {values}
    </div>
  );
};

export default connect(
  ({ sectionTextInputs, sectionResults }, { sectionId }) => ({
    textInputs: get(sectionId, sectionTextInputs),
    results: get(sectionId, sectionResults),
  }),
  (dispatch, { sectionId }) => ({
    setTextInputs: e => dispatch(setTextInputs(sectionId, e.target.value.split('\n'))),
  })
)(TextView);
