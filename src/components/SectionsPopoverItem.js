// @flow
import React, { Component } from 'react';
import { equals, cond } from 'lodash/fp';
import { itemEdit, item, deleteIcon } from '../../styles/sections-popover.css';


export default class SectionsPopoverItem extends Component {
  constructor({ title }: { title: string }) {
    super();
    this.state = { title, isEditing: false };
  }

  state: { title: string, isEditing: bool }

  onInput = ({ target }: Object) => this.setState({ title: target.value });
  onKeyDown = ({ keyCode }: Object) => cond([
    // enter
    [equals(13), () => {
      this.props.onSetTitle(this.state.title);
      this.setState({ isEditing: false });
    }],
    // escape
    [equals(27), () => { this.setState({ isEditing: false }); }],
  ])(keyCode);
  toggleEditing = () => { this.setState({ isEditing: !this.state.isEditing }); };

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
        {title || `Section ${index + 1}`}
        <button className={deleteIcon} onClick={onDelete}>
          <span className="pe-7s-trash" />
        </button>
      </div>
    );
  }
}
