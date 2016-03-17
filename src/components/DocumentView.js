import React, { PropTypes } from 'react';
import { identity, equals, always, cond, contains, prop, objOf } from 'ramda';
import { connect } from 'react-redux';
import { TweenState } from 'state-transitions';
import Page from './page';
import { Header, HeaderSection } from './Header';
import { StackButton, HorizontalLink } from './HeaderButton';
import SettingsPopup from './SettingsPopup';
import UnitsPopup from './UnitsPopup';
import SectionsPopover from './SectionsPopover';

const UNITS = 'units';
const SETTINGS = 'settings';
const SECTIONS = 'sections';

class DocumentView extends React.Component {
  constructor() {
    super();

    this.state = {
      popup: null,
      popover: null,
    };

    this.setPopover = (type, e) => {
      const { popover } = this.state;
      if (popover && popover.type === type) {
        this.setState({ popover: null });
      } else {
        const { bottom, left, width } = e.currentTarget.getBoundingClientRect();
        this.setState(objOf('popover', {
          type,
          top: bottom,
          left: left + width / 2,
        }));
      }
    };
    this.toggleSections = (e) => this.setPopover(SECTIONS, e);
    this.toggleUnitsPopup = () => this.setState({ popup: UNITS });
    this.toggleSettingsPopup = () => this.setState({ popup: SETTINGS });
    this.closePopover = () => this.setState({ popover: null });
    this.closePopup = () => this.setState({ popup: null });
  }

  componentWillMount() {
    // Done this way so if you delete a document, you'll navigate back home automatically
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps({ params, documents }) {
    const { documentId } = params;

    if (!contains(documentId, documents)) {
      this.context.router.push('/');
    }
  }

  render() {
    const { params, documents } = this.props;
    const { documentId } = params;

    if (!contains(documentId, documents)) {
      return <div />;
    }

    const { popup, popover } = this.state;

    const popupElement = cond([
      [equals(SETTINGS), () => (
        <SettingsPopup documentId={documentId} onClose={this.closePopup} />
      )],
      [equals(UNITS), () => (
        <UnitsPopup documentId={documentId} onClose={this.closePopup} />
      )],
      [always(true), always(null)],
    ])(popup);

    const popoverElement = cond([
      [equals(SECTIONS), () => (
        <SectionsPopover
          documentId={documentId}
          top={popover.top}
          left={popover.left}
          onClose={this.closePopover}
        />
      )],
      [always(true), always(null)],
    ])(prop('type', popover || {}));

    return (
      <div>
        <Header>
          <HeaderSection place="left">
            <HorizontalLink icon="angle-left" text="Documents" to="/" />
          </HeaderSection>
          <HeaderSection place="center">
            <StackButton icon="notebook" text="Sections" onClick={this.toggleSections} />
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
        { popupElement }
        { popoverElement }
      </div>
    );
  }
}
DocumentView.contextTypes = {
  router: PropTypes.object,
};

export default connect(identity)(DocumentView);
