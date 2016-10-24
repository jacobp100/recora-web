// @flow
import React, { PropTypes } from 'react';
import { flow, mapValues, toPairs, map, join } from 'lodash/fp';
import {
  container, popup, title, buttonGroup, heading, button as popupButton,
} from '../../styles/popup.css';
import { button } from '../../styles/base.css';

const dropboxParams = {
  url: 'https://www.dropbox.com/oauth2/authorize',
  response_type: 'token',
  client_id: 'w0683mxt3cgd5vq',
  redirect_uri: 'http://localhost:8080?account=dropbox',
};

const paramString = flow(
  mapValues(encodeURIComponent),
  toPairs,
  map(join('=')),
  join('&')
);

const getOAuthUrl = ({ url, ...params }) => `${url}?${paramString(params)}`;

const AddAccountPopup = ({ onClose }) => (
  <div className={container}>
    <div className={popup}>
      <h1 className={title}>Add Account</h1>
      <input value="FIXME" />
      <button className={button}>
        Add Local Folder
      </button>
      <h2 className={heading}>External</h2>
      <a href={getOAuthUrl(dropboxParams)} className={button}>
        Dropbox
      </a>
      &nbsp;
      <button className={button}>
        Google Drive
      </button>
      <div className={buttonGroup}>
        <button className={popupButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  </div>
);

AddAccountPopup.propTypes = {
  onClose: PropTypes.func,
};

export default AddAccountPopup;
