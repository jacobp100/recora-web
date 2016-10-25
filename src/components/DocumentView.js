// @flow
import React, { Component, PropTypes } from 'react';
import { equals, constant, cond, matchesProperty, stubTrue, get } from 'lodash/fp';
import { TweenState } from 'state-transitions';
import Page from './Page';
import { Header, HeaderSection } from './Header';
import { StackButton, HorizontalLink } from './HeaderButton';
import Popover from './Popover';
import SettingsPopup from './SettingsPopup';
import SectionsPopover from './SectionsPopover';


const SETTINGS = 'settings';
const SECTIONS = 'sections';

export default class DocumentView extends Component {
  static propTypes = {
    params: PropTypes.shape({
      documentId: PropTypes.string.isRequired,
    }).isRequired,
  }

  state = {
    popup: null,
    popover: null,
  }

  setPopover = (type: string, e: Object) => {
    const popover = get(['popover', 'type'], this.state) !== type
      ? Popover.getPopover(type, e)
      : null;
    this.setState({ popover });
  }

  toggleSettingsPopup = () => this.setState({ popup: SETTINGS })
  closePopup = () => this.setState({ popup: null })

  toggleSectionsPopover = (e: Object) => this.setPopover(SECTIONS, e)
  closePopover = () => this.setState({ popover: null })

  renderPopup = cond([
    [equals(SETTINGS), () => (
      <SettingsPopup documentId={this.props.params.documentId} onClose={this.closePopup} />
    )],
    [stubTrue, constant(null)],
  ]);

  renderPopover = cond([
    [matchesProperty('type', SECTIONS), popover => (
      <SectionsPopover
        {...popover}
        documentId={this.props.params.documentId}
        onClose={this.closePopover}
      />
    )],
    [stubTrue, constant(null)],
  ]);

  render() {
    const { popup, popover } = this.state;
    const { params } = this.props;
    const { documentId } = params;

    return (
      <div>
        <Header>
          <HeaderSection place="left">
            <HorizontalLink iconName="angle-left" text="Documents" to="/" />
          </HeaderSection>
          <HeaderSection place="center">
            <StackButton iconName="notebook" text="Sections" onClick={this.toggleSectionsPopover} />
          </HeaderSection>
          <HeaderSection place="right">
            <StackButton iconName="share" text="Share" />
            <StackButton iconName="print" text="Print" />
            <StackButton iconName="config" text="Settings" onClick={this.toggleSettingsPopup} />
          </HeaderSection>
        </Header>
        <TweenState id={`doc-${documentId}`} fadeOutDuration={0.4}>
          <Page documentId={documentId} />
        </TweenState>
        {this.renderPopup(popup)}
        {this.renderPopover(popover)}
      </div>
    );
  }
}
