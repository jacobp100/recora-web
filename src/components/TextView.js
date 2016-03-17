import {
  map, mapAccum, objOf, zip, flatten, last, append, reject, isNil, split, prop, pipe, partial,
} from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { setTextInputs } from '../actions';
import * as tagNames from '../../styles/tag-names.css';
import * as textView from '../../styles/text-view.css';

const textToArray = pipe(
  prop('target'),
  prop('value'),
  split('\n')
);

const SpanningElement = ({ entry, start = 0, end = Infinity, type }) => (
  <span className={classnames('tag', tagNames[type])}>
    { entry.text.substring(start, end) }
  </span>
);

const TextViewEntry = ({ entry, text }) => {
  // Recora strips out some noop tags from the start, middle and end,
  // but we need to actually show that text.
  let entryTags = entry.tags || [{ start: 0, end: entry.text.length }];

  const lastEntryTag = last(entryTags);
  if (lastEntryTag.end !== text.length) {
    entryTags = append({ start: lastEntryTag.end, end: text.length }, entryTags);
  }

  let spanningElements = mapAccum((index, { start, end, type }) => {
    const preKey = `pre-${start}`;
    const key = `${start}-${end}`;

    const elements = reject(isNil, [
      start !== index
        ? <SpanningElement key={preKey} entry={entry} start={index} end={start} />
        : null,
      <SpanningElement key={key} entry={entry} start={start} end={end} type={type} />,
    ]);
    return [end, elements];
  }, 0, entryTags)[1];

  spanningElements = flatten(spanningElements);

  return (
    <div className={textView.entry}>
      <div className={textView.input}>
        { spanningElements }
      </div>
      <div className={textView.result}>
        { entry.resultToString }
      </div>
    </div>
  );
};

const TextView = ({ documentId, sectionId, textInputs, entries, setTextInputs }) => {
  const text = textInputs.join('\n');
  const entriesWithText = entries || map(objOf('text'), textInputs);

  let values = map(([entryText, entry]) => (
    <TextViewEntry text={entryText} entry={entry} />
  ), zip(textInputs, entriesWithText));
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
    <div className={textView.container}>
      <textarea
        className={textView.textarea}
        value={text}
        onChange={pipe(textToArray, partial(setTextInputs, [documentId, sectionId]))}
      />
      { values }
    </div>
  );
};

export default connect(
  ({ sectionTextInputs, sectionEntries }, { sectionId }) => ({
    sectionId,
    textInputs: prop(sectionId, sectionTextInputs || {}),
    entries: prop(sectionId, sectionEntries || {}),
  }),
  { setTextInputs },
  null,
  { pure: true }
)(TextView);
