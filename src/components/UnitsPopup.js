// @flow
import React, { Component } from 'react';
import { map, pickBy, keys, propEq, assoc, prop } from 'lodash/fp';
import { connect } from 'react-redux';
// import units from 'recora/src/data/environment/units';
import { setConfig } from '../redux';
import {
  container, horizontal, label, dropdown, popup, title, heading, paragraph, buttonGroup,
  button as popupButton,
} from '../../styles/popup.css';
import { button } from '../../styles/base.css';

const visibleSiUnits = [
  ['Currency', 'currency'],
  ['Distance', 'length'],
  ['Weight', 'weight'],
  ['Volume', 'volume'],
  ['Temperature', 'temperature'],
  ['Time', 'time'],
];

const getUnitsForType = (type) => keys(pickBy(propEq('type', type), units));

class UnitsPopup extends Component {
  constructor({ config }) {
    super();

    this.onSubmit = () => {
      this.props.setConfig(this.props.documentId, this.state);
      this.props.onClose();
    };

    this.setUnit = ({ target }) => {
      const { value, name } = target;
      const si = assoc(name, value, this.state.si);
      this.setState({ si });
    };

    this.state = config;
  }

  render() {
    const { onClose } = this.props;
    const { si } = this.state;

    const unitSettings = map(([title, type]) => {
      const options = map((option) => (
        <option key={option} value={option}>{ option }</option>
      ), getUnitsForType(type));

      return (
        <div className={horizontal}>
          <label className={label} htmlFor={`unit-${type}`}>
            { title }
          </label>
          <select className={dropdown} name={type} value={si[type]} onChange={this.setUnit}>
            { options }
          </select>
        </div>
      );
    }, visibleSiUnits);

    return (
      <div className={container}>
        <div className={popup}>
          <h1 className={title}>Units</h1>
          { unitSettings }
          <h2 className={heading}>Currency Rates</h2>
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
    config: prop(documentId, documentConfigs || {}),
  }),
  { setConfig },
  null,
  { pure: true }
)(UnitsPopup);
