// @flow
import React from 'react';
import { equals, cond } from 'lodash/fp';
import { itemEdit, item, deleteIcon } from '../../styles/sections-popover.css';


export default class SectionsPopoverItem extends React.Component {
  constructor({ title }) {
    super();
    this.state = { title, isEditing: false };
    this.toggleEditing = () => this.setState({ isEditing: !this.state.isEditing });
    this.onInput = ({ target }) => this.setState({ title: target.value });
    this.onKeyDown = ({ keyCode }) => cond([
      // enter
      [equals(13), () => {
        this.props.onSetTitle(this.state.title);
        this.setState({ isEditing: false });
      }],
      // escape
      [equals(27), () => { this.setState({ isEditing: false }); }],
    ])(keyCode);
  }

  render() {
    const { index, onDelete } = this.props;
    const { title, isEditing } = this.state;

    if (isEditing) {
      return (
        <input
          className={itemEdit}
          value={title}
          type="text"
          onKeyDown={this.onKeyDown}
          onInput={this.onInput}
          autoFocus
        />
      );
    }

    return (
      <div className={item} onDoubleClick={this.toggleEditing}>
        { title || `Section ${index + 1}` }
        <button className={deleteIcon} onClick={onDelete}>
          <span className="pe-7s-trash" />
        </button>
      </div>
    );
  }
}
