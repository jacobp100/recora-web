import React from 'react';
import { identity, equals, always, cond } from 'ramda';
import { connect } from 'react-redux';
import { TweenState } from 'state-transitions';
import Page from './page';
import { Header, HeaderSection } from './Header';
import { StackButton, HorizontalLink } from './HeaderButton';
import SettingsPopup from './SettingsPopup';
import UnitsPopup from './UnitsPopup';
import { setTextInputs } from '../actions';

const UNITS = 'units';
const SETTINGS = 'settings';

export default connect(identity)(class DocumentView extends React.Component {
  constructor() {
    super();

    this.state = {
      popup: null,
    };

    this.setTextInputs = (sectionId) => (e) => this.props.dispatch(setTextInputs(
      this.props.params.id, sectionId, e.target.value.split('\n')
    ));
    this.closePopup = () => this.setState({ popup: null });
    this.toggleUnitsPopup = () => this.setState({ popup: UNITS });
    this.toggleSettingsPopup = () => this.setState({ popup: SETTINGS });
  }

  render() {
    const {
      params, documentTitles, documentSections, documentConfigs, sectionTextInputs, sectionEntries,
      sectionTotalTexts,
    } = this.props;
    const { id } = params;
    const title = documentTitles[id];
    const sections = documentSections[id];
    const config = documentConfigs[id];

    const { popup } = this.state;

    const popupElement = cond([
      [equals(SETTINGS), always(
        <SettingsPopup onClose={this.closePopup} />
      )],
      [equals(UNITS), always(
        <UnitsPopup config={config} onClose={this.closePopup} />
      )],
      [always(true), always(null)],
    ])(popup);

    return (
      <div>
        <Header>
          <HeaderSection place="left">
            <HorizontalLink icon="angle-left" text="Documents" to="/" />
          </HeaderSection>
          <HeaderSection place="center">
            <StackButton icon="notebook" text="Sections" />
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
            sectionTextInputs={sectionTextInputs}
            sectionEntries={sectionEntries}
            sectionTotalTexts={sectionTotalTexts}
            setTextInputs={this.setTextInputs}
          />
        </TweenState>
        { popupElement }
      </div>
    );
  }
});
