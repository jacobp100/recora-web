import React, { PropTypes } from 'react';
import { identity, equals, always, cond, contains, prop } from 'ramda';
import { connect } from 'react-redux';
import { TweenState } from 'state-transitions';
import Page from './page';
import { Header, HeaderSection } from './Header';
import { StackButton, HorizontalLink } from './HeaderButton';
import SettingsPopup from './SettingsPopup';
import UnitsPopup from './UnitsPopup';
import SectionsPopover from './SectionsPopover';
import {
  setTextInputs, addSection, setSectionTitle, deleteSection, reorderSections, deleteDocument,
} from '../actions';

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

    this.getId = () => this.props.params.id;

    this.setTextInputs = (sectionId) => (e) => this.props.dispatch(setTextInputs(
      this.getId(), sectionId, e.target.value.split('\n')));
    this.addSection = () => this.props.dispatch(
      addSection(this.getId()));
    this.setSectionTitle = (sectionId, title) => this.props.dispatch(
      setSectionTitle(sectionId, title));
    this.deleteSection = (sectionId) => this.props.dispatch(
      deleteSection(this.getId(), sectionId));
    this.reorderSections = (order) => this.props.dispatch(
      reorderSections(this.getId(), order));
    this.deleteDocument = () => this.props.dispatch(
      deleteDocument(this.getId()));

    this.setPopover = (type, e) => {
      const { popover } = this.state;
      if (popover && popover.type === type) {
        this.setState({ popover: null });
      } else {
        const { bottom, left, width } = e.currentTarget.getBoundingClientRect();
        this.setState({
          popover: {
            type,
            top: bottom,
            left: left + width / 2,
          },
        });
      }
    };
    this.toggleSections = (e) => this.setPopover(SECTIONS, e);
    this.toggleUnitsPopup = () => this.setState({ popup: UNITS });
    this.toggleSettingsPopup = () => this.setState({ popup: SETTINGS });
    this.closePopover = () => this.setState({ popover: null });
    this.closePopup = () => this.setState({ popup: null });
  }

  componentWillMount() {
    this.componentWillReceiveProps(this.props);
  }

  componentWillReceiveProps({ params, documents }) {
    const { id } = params;

    if (!contains(id, documents)) {
      this.context.router.push('/');
    }
  }

  render() {
    const {
      params, documents, documentTitles, documentSections, documentConfigs, sectionTitles,
      sectionTextInputs, sectionEntries, sectionTotalTexts,
    } = this.props;
    const { id } = params;

    const title = documentTitles[id];
    const sections = documentSections[id];
    const config = documentConfigs[id];

    if (!contains(id, documents)) {
      return <div />;
    }

    const { popup, popover } = this.state;

    const popupElement = cond([
      [equals(SETTINGS), () => (
        <SettingsPopup onClose={this.closePopup} onDeleteDocument={this.deleteDocument} />
      )],
      [equals(UNITS), () => (
        <UnitsPopup config={config} onClose={this.closePopup} />
      )],
      [always(true), always(null)],
    ])(popup);

    const popoverElement = cond([
      [equals(SECTIONS), () => (
        <SectionsPopover
          top={popover.top}
          left={popover.left}
          sections={sections}
          sectionTitles={sectionTitles}
          onAddSection={this.addSection}
          onRenameSection={this.setSectionTitle}
          onReorderSections={this.reorderSections}
          onDeleteSection={this.deleteSection}
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
        <TweenState id={`doc-${id}`} fadeOutDuration={0.4}>
          <Page
            title={title}
            sections={sections}
            sectionTitles={sectionTitles}
            sectionTextInputs={sectionTextInputs}
            sectionEntries={sectionEntries}
            sectionTotalTexts={sectionTotalTexts}
            setTextInputs={this.setTextInputs}
          />
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
