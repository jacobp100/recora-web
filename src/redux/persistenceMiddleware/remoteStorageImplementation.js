// @flow
import { map, reduce, startsWith, update, trim, isEmpty, curry } from 'lodash/fp';
import { append } from '../../util';
import { STORAGE_ACTION_SAVE, STORAGE_ACTION_REMOVE } from '../../types';
import type { Document, Section, StorageInterface, RemoteStorageLocation } from '../../types'; // eslint-disable-line


const sectionToString = (section: Section) => {
  const titleString = `# ${section.title}`;
  const textInputStrings = map(input => `> ${input}`, section.textInputs);
  return [titleString, ...textInputStrings].join('\n');
};

const documentToString = (document: Document) => (
  map(sectionToString, document.sections).join('\n')
);

const parseDocumentString = (filename, string: string) => reduce((document, line) => {
  if (startsWith('#', line)) {
    const title = trim(line.substring(1));
    const section: Section = {
      id: null,
      title,
      textInputs: [],
    };

    return update('sections', append(section), document);
  } if (startsWith('>', line) && !isEmpty(document.sections)) {
    const lastSectionIndex = document.sections.length - 1;
    const textInput = trim(line.substring(1));

    return update(['sections', lastSectionIndex, 'textInputs'], append(textInput), document);
  }
  return document;
}, {
  id: null,
  title: filename,
  sections: [],
}, string.split('\n'));

const setAccountProperties = curry((account, storageLocation) => ({
  ...storageLocation,
  accountId: account.id,
}));

export default (type, remote): StorageInterface => {
  const loadDocuments = async (account): RemoteStorageLocation[] => {
    const storageLocations = await remote.list(account.token);
    return map(setAccountProperties(account), storageLocations);
  };

  const loadDocument = async (account, storageLocation: RemoteStorageLocation): Document => {
    const contents = await remote.get(account.token, storageLocation);
    const document: Document = parseDocumentString(storageLocation.title, contents);
    return document;
  };

  const storageModes = {
    [STORAGE_ACTION_SAVE]: (account, storageLocation, document) =>
      remote.post(account.token, storageLocation, documentToString(document), document)
        .then(setAccountProperties(account)),
    [STORAGE_ACTION_REMOVE]: (account, storageLocation) =>
      remote.delete(account.token, storageLocation)
        .then(() => null),
  };

  const updateStore = (storageOperations) => {
    const promises = map(({ action, account, storageLocation, document }) => (
      storageModes[action](account, storageLocation, document)
    ), storageOperations);

    return Promise.all(promises);
  };

  return {
    type,
    // delay: 15000,
    delay: 1000,
    maxWait: 30000,
    loadDocuments,
    loadDocument,
    updateStore,
  };
};
