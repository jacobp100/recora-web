// @flow
/* global fetch */
import remoteStorageImplementation from './remoteStorageImplementation';
import { STORAGE_DROPBOX } from '../../types';
import type { DropBoxStorageBase } from '../../types'; // eslint-disable-line

const baseUri = 'https://content.dropboxapi.com/2/files';

export default () => remoteStorageImplementation(STORAGE_DROPBOX, {
  get: (token, { path, rev }: DropBoxStorageBase) => fetch(`${baseUri}/download`, {
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

  post: (token, { path, rev }: DropBoxStorageBase, body) => fetch(`${baseUri}/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path,
        mode: rev ? {
          '.tag': 'update',
          update: rev,
        } : {
          '.tag': 'add',
        },
        autorename: true,
      }),
    },
    body,
  }).then(response => (
    response.json()
  )).then(body => ({
    path: body.path_display,
    rev: body.rev,
  }: DropBoxStorageBase)),

  delete: (token, { path }: DropBoxStorageBase) => fetch(`${baseUri}/delete`, {
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
