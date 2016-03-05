import React from 'react';
import { map, pickBy, keys, propEq } from 'ramda';
import units from 'recora/src/data/environment/units';
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

export default class SettingsPopup extends React.Component {
  constructor({ config }) {
    super();
    this.state = config;
  }
  render() {
    const { onClose } = this.props;
    const { si } = this.state;

    const unitSettings = map(([title, type]) => {
      const options = map((option) => (
        <option value={option}>{ option }</option>
      ), getUnitsForType(type));

      return (
        <div className={popup.horizontal}>
          <label className={popup.label} htmlFor={`unit-${type}`}>
            { title }
          </label>
          <select className={popup.dropdown} value={si[type]}>
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
          <div className={popup.popupButtonGroup}>
            <button className={popup.popupButton}>
              Save Changes
            </button>
            <button className={popup.popupButton} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
}
