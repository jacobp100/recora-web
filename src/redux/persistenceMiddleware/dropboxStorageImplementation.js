// @flow
/* global fetch */
import { map } from 'lodash/fp';
import remoteStorageImplementation from './remoteStorageImplementation';
import { STORAGE_DROPBOX } from '../../types';
import type { DropBoxStorageBase } from '../../types'; // eslint-disable-line

const apiUri = 'https://api.dropboxapi.com/2/files';
const contentUri = 'https://content.dropboxapi.com/2/files';

const entryToStorageLocation = entry => ({
  id: entry.id,
  title: entry.name.match(/^[^.]*/)[0],
  lastModified: Date.parse(entry.client_modified),
  path: entry.path_display,
  rev: entry.rev,
});

export default () => remoteStorageImplementation(STORAGE_DROPBOX, {
  list: token => fetch(`${apiUri}/list_folder`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: '',
      recursive: true,
    }),
  }).then(response => (
    response.json()
  )).then(body => map(entryToStorageLocation, body.entries)),

  get: (token, { path, rev }: DropBoxStorageBase) => fetch(`${contentUri}/download`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Dropbox-API-Arg': JSON.stringify({
        path,
        rev,
      }),
    },
  }).then(response => (
    response.text()
  )),

  post: (token, { path, rev }: DropBoxStorageBase, body, doc) => fetch(`${contentUri}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: path || `/${doc.title}.recora`,
        mode: rev ? { '.tag': 'update', update: rev } : 'add',
        autorename: true,
      }),
    },
    body,
  }).then(response => (
    response.json()
  )).then(entryToStorageLocation),

  delete: (token, { path }: DropBoxStorageBase) => fetch(`${apiUri}/delete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
    }),
  }),
});
