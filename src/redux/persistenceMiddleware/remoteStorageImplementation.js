// @flow
import { map, reduce, startsWith, update, set, flow, trim, isEmpty, filter } from 'lodash/fp';
import { append } from '../../util';
import { STORAGE_ACTION_SAVE } from '../../types';
import type { Document, Section, StorageInterface, RemoteStorageLocation } from '../../types'; // eslint-disable-line


const sectionToString = (section: Section) => {
  const titleString = `## ${section.title}\n`;
  const textInputStrings = map(input => `> ${input}\n`, section.textInputs);
  return [titleString, ...textInputStrings].join('');
};

const documentToString = (document: Document) => {
  const titleString = `# ${document.title}\n`;
  const sectionStrings = map(sectionToString, document.sections);

  [titleString, ...sectionStrings].join('\n');
};

const parseDocumentString = (string: string) => reduce((document, line) => {
  if (startsWith('##', line)) {
    const title = trim(line.substring(2));
    const section: Section = {
      id: null,
      title,
      textInputs: [],
    };

    return update('sections', append(section), document);
  } else if (startsWith('#', line)) {
    const title = trim(line.substring(1));
    return set('title', title, document);
  } if (startsWith('>', line) && !isEmpty(document.sections)) {
    const lastSectionIndex = document.sections.length - 1;
    const textInput = trim(line.substring(1));

    return update(['sections', lastSectionIndex, 'textInputs'], append(textInput), document);
  }
  return document;
}, {
  id: null,
  title: '',
  sections: [],
}, string.split('\n'));

export default (type, remote): StorageInterface => {
  const loadDocument = async (storageLocation: RemoteStorageLocation) => {
    const contents = await remote.get(storageLocation.userId, storageLocation.path);
    const document: Document = parseDocumentString(contents);
    return document;
  };

  const updateStore = flow(
    // Ignore remove actions
    filter({ type: STORAGE_ACTION_SAVE }),
    map(({ document, storageLocation }) => remote.post(
      documentToString(document),
      storageLocation.userId,
      storageLocation.path
    )),
    fetchRequests => Promise.all(fetchRequests)
  );

  return {
    type,
    delay: 15000,
    maxWait: 30000,
    loadDocument,
    updateStore,
  };
};
