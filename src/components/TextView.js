// @flow
import { map, reduce, keys, last, concat, compact, get, getOr } from 'lodash/fp';
import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { setTextInputs } from '../redux';
import * as tagNames from '../../styles/tag-names.css';
import { container, textarea, entryContainer, input, output } from '../../styles/text-view.css';


const SpanningElement = ({ children, type }) => (
  <span className={classnames('tag', (type in tagNames) && tagNames[type])}>
    {children}
  </span>
);

const TextViewEntryContainer = ({ entry, result }) => (
  <div className={entryContainer}>
    <div className={input}>
      {entry}
    </div>
    <div className={output}>
      {result}
    </div>
  </div>
);

const TextViewEntry = ({ result, text }) => {
  // Recora strips out some noop tags from the start, middle and end,
  // but we need to actually show that text.
  let resultTokens = get('tokens', result) || [{ start: 0, end: text.length }];

  const lastEntryTag = last(resultTokens);
  if (lastEntryTag.end !== text.length) {
    resultTokens = concat(resultTokens, { start: lastEntryTag.end, end: text.length });
  }

  const { spanningElements } = reduce(({ index, spanningElements }, { start, end, type }) => {
    const preKey = `pre-${start}`;
    const key = `${start}-${end}`;

    const newSpanningElements = compact([
      start !== index
        ? <SpanningElement key={preKey} text={text.substring(index, start)} />
        : null,
      <SpanningElement key={key} text={text.substring(start, end)} type={type} />,
    ]);

    return {
      index: end,
      spanningElements: spanningElements.concat(newSpanningElements),
    };
  }, {
    index: 0,
    spanningElements: [],
  }, resultTokens);

  return <TextViewEntryContainer entry={spanningElements} result={get('pretty', result)} />;
};

const TextView = ({ textInputs, results, setTextInputs }) => {
  const text = textInputs.join('\n');

  let values;
  if (text.length === 0) {
    const placeholderText = 'Type to begin calculation…';
    const placeholder = <SpanningElement type="placeholder">{placeholderText}</SpanningElement>;
    values = [<TextViewEntryContainer key="placeholder" entry={placeholder} result={null} />];
  } else {
    // Note above, if entries isn't ready yet, fake it with the text inputs (which will be ready)
    // This will mean that we'll see black text without results until entries is fully loaded, and
    // then it will adjust afterwards (without the page reflowing).

    const resultsWithText = results || map(text => ({ text }), textInputs);
    values = map(index => (
      <TextViewEntry key={index} text={textInputs[index]} result={resultsWithText[index]} />
    ), keys(textInputs));
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
    textInputs: getOr([], sectionId, sectionTextInputs),
    results: get(sectionId, sectionResults),
  }),
  (dispatch, { sectionId }) => ({
    setTextInputs: e => dispatch(setTextInputs(sectionId, e.target.value.split('\n'))),
  })
)(TextView);
