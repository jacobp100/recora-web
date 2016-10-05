// @flow
import React, { Component, PropTypes } from 'react';
import { equals, always, cond, matchesProperty } from 'lodash/fp';
import { TweenState } from 'state-transitions';
import Page from './Page';
import { Header, HeaderSection } from './Header';
import { StackButton, HorizontalLink } from './HeaderButton';
import SettingsPopup from './SettingsPopup';
import UnitsPopup from './UnitsPopup';
import SectionsPopover from './SectionsPopover';

type Popover = { type: string, top: number, left: number };

const UNITS = 'units';
const SETTINGS = 'settings';
const SECTIONS = 'sections';

export default class DocumentView extends Component {
  static propTypes = {
    params: PropTypes.shape({
      documentId: PropTypes.string.isRequired,
    }).isRequired,
  }

  state: {
    popup: ?string,
    popover: ?Popover,
  } = {
    popup: null,
    popover: null,
  }

  setPopover = (type: string, e: Object) => {
    const { popover } = this.state;
    if (popover && popover.type === type) {
      this.setState({ popover: null });
    } else {
      const { bottom, left, width } = e.currentTarget.getBoundingClientRect();
      const newPopover = { type, top: bottom, left: left + (width / 2) };
      this.setState({ popover: newPopover });
    }
  }

  toggleUnitsPopup = () => this.setState({ popup: UNITS })
  toggleSettingsPopup = () => this.setState({ popup: SETTINGS })
  closePopup = () => this.setState({ popup: null })

  toggleSectionsPopover = (e: Object) => this.setPopover(SECTIONS, e)
  closePopover = () => this.setState({ popover: null })

  renderPopup = cond([
    [equals(SETTINGS), () => (
      <SettingsPopup documentId={this.props.documentId} onClose={this.closePopup} />
    )],
    [equals(UNITS), () => (
      <UnitsPopup documentId={this.props.documentId} onClose={this.closePopup} />
    )],
    [always(true), always(null)],
  ]);

  renderPopover = cond([
    [matchesProperty('type', SECTIONS), popover => (
      <SectionsPopover
        documentId={this.props.documentId}
        top={popover.top}
        left={popover.left}
        onClose={this.closePopover}
      />
    )],
    [always(true), always(null)],
  ]);

  render() {
    const { popup, popover } = this.state;
    const { params } = this.props;
    const { documentId } = params;

    return (
      <div>
        <Header>
          <HeaderSection place="left">
            <HorizontalLink icon="angle-left" text="Documents" to="/" />
          </HeaderSection>
          <HeaderSection place="center">
            <StackButton icon="notebook" text="Sections" onClick={this.toggleSectionsPopover} />
          </HeaderSection>
          <HeaderSection place="right">
            <StackButton icon="share" text="Share" />
            <StackButton icon="print" text="Print" />
            <StackButton icon="graph3" text="Units" onClick={this.toggleUnitsPopup} />
            <StackButton icon="config" text="Settings" onClick={this.toggleSettingsPopup} />
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
