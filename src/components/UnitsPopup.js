import React, { Component } from 'react';
import { map, pickBy, keys, propEq, assoc, prop, allPass as juxt } from 'ramda';
import { connect } from 'react-redux';
import units from 'recora/src/data/environment/units';
import { setConfig } from '../actions';
import popup from '../../styles/popup.css';
import base from '../../styles/base.css';

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
      this.props.setConfig(this.state);
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
        <div className={popup.horizontal}>
          <label className={popup.label} htmlFor={`unit-${type}`}>
            { title }
          </label>
          <select className={popup.dropdown} name={type} value={si[type]} onChange={this.setUnit}>
            { options }
          </select>
        </div>
      );
    }, visibleSiUnits);

    return (
      <div className={popup.container}>
        <div className={popup.popup}>
          <h1 className={popup.title}>Units</h1>
          { unitSettings }
          <h2 className={popup.heading}>Currency Rates</h2>
          <p className={popup.paragraph}>
            All currency rates will be updated to their current values unless overridden here.
          </p>
          <button className={base.button}>Add Currency Rate</button>
          <div className={popup.buttonGroup}>
            <button className={popup.button} onClick={this.onSubmit}>
              Save Changes
            </button>
            <button className={popup.button} onClick={onClose}>
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
  (dispatch, { documentId }) => ({
    setConfig: (config) =>
      dispatch(setConfig(documentId, config)),
  }),
  null,
  { pure: true }
)(UnitsPopup);
