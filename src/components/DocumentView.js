import React from 'react';
import { identity } from 'ramda';
import { connect } from 'react-redux';
import Page from './page';
import { Header, HeaderSection } from './Header';
import { StackButton, HorizontalLink } from './HeaderButton';
import { TweenState } from 'state-transitions';
import { setTextInputs } from '../actions';

export default connect(identity)(class DocumentView extends React.Component {
  constructor() {
    super();
    this.setTextInputs = (sectionId) => (e) => this.props.dispatch(setTextInputs(
      this.props.params.id, sectionId, e.target.value.split('\n')
    ));
  }

  render() {
    const {
      params, documentTitles, documentSections, sectionTextInputs, sectionEntries,
      sectionTotalTexts,
    } = this.props;
    const { id } = params;
    const title = documentTitles[id];
    const sections = documentSections[id];

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
            <StackButton icon="graph3" text="Units" />
            <StackButton icon="config" text="Settings" />
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
      </div>
    );
  }
});
