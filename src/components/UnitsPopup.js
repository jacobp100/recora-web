// @flow
import React, { Component } from 'react';
import { set, get } from 'lodash/fp';
import { connect } from 'react-redux';
// import units from 'recora/src/data/environment/units';
import { setConfig } from '../redux';
import {
  container, popup, heading, paragraph, buttonGroup,
  button as popupButton,
} from '../../styles/popup.css';
import { button } from '../../styles/base.css';


class UnitsPopup extends Component {
  constructor({ config }) {
    super();
    this.state = config;
  }

  state: Object

  onSubmit = () => {
    this.props.setConfig(this.props.documentId, this.state);
    this.props.onClose();
  }

  setUnit = ({ target }) => {
    const { value, name } = target;
    const si = set(name, value, this.state.si);
    this.setState({ si });
  }

  render() {
    const { onClose } = this.props;

    return (
      <div className={container}>
        <div className={popup}>
          <h1 className={heading}>Currency Rates</h1>
          <p className={paragraph}>
            All currency rates will be updated to their current values unless overridden here.
          </p>
          <button className={button}>Add Currency Rate</button>
          <div className={buttonGroup}>
            <button className={popupButton} onClick={this.onSubmit}>
              Save Changes
            </button>
            <button className={popupButton} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ documentConfigs }, { documentId }) => ({
    config: get(documentId, documentConfigs),
  }),
  { setConfig },
  null,
  { pure: true }
)(UnitsPopup);
