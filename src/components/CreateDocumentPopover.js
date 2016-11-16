// @flow
import React, { Component } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { flow, filter, map } from 'lodash/fp';
import Popover from './Popover';
import { STORAGE_LOCAL } from '../types';
import { addDocumentForAccount } from '../redux';
import { button, buttonBlock, fieldInput, invalid } from '../../styles/base.css';


const Optgroup = ({ label, isLocal = false, accounts, accountTypes, accountNames }) => (
  <optgroup label={label}>
    {flow(
      filter(account => ((accountTypes[account] === STORAGE_LOCAL) === isLocal)),
      map(account => (<option key={account} value={account}>{accountNames[account]}</option>))
    )(accounts)}
  </optgroup>
);

/* eslint-disable jsx-a11y/label-has-for */
class CreateDocumentPopover extends Component {
  state = {
    invalid: false,
  }

  onSubmit = () => {
    if (!this.filenameInput || !this.accountInput) throw new Error('Component not mounted');

    const filename = this.filenameInput.value;
    const accountId = this.accountInput.value;

    const invalid = !filename;

    this.setState({ invalid });

    if (!invalid) {
      this.props.addDocumentForAccount(filename, accountId);
      this.props.onClose();
    }
  }

  filenameInput = null;
  accountInput = null;

  render() {
    const { top, left, accounts, accountTypes, accountNames, onClose } = this.props;

    return (
      <Popover top={top} left={left} width={300} onClose={onClose}>
        <label>
          Filename
          <input
            ref={input => { this.filenameInput = input; }}
            className={classnames(fieldInput, this.state.invalid && invalid)}
            placeholder="New Document"
            minLength="3"
          />
        </label>
        <label>
          Location
          <select
            ref={input => { this.accountInput = input; }}
            className={classnames(fieldInput, this.state.invalid && invalid)}
            defaultValue={accounts[0]}
          >
            <Optgroup
              label="Local"
              accounts={accounts}
              accountTypes={accountTypes}
              accountNames={accountNames}
              isLocal
            />
            <Optgroup
              label="Cloud"
              accounts={accounts}
              accountTypes={accountTypes}
              accountNames={accountNames}
            />
          </select>
        </label>
        <button className={classnames(button, buttonBlock)} onClick={this.onSubmit}>
          Create Document
        </button>
      </Popover>
    );
  }
}
/* eslint-enable */

export default connect(
  ({ accounts, accountTypes, accountNames }) => ({
    accounts,
    accountTypes,
    accountNames,
  }),
  { addDocumentForAccount }
)(CreateDocumentPopover);
