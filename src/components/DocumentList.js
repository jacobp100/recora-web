import React from 'react';
import { identity, map } from 'ramda';
import { connect } from 'react-redux';
import { AnimateInOut } from 'state-transitions';
import classnames from 'classnames';
import { Header, HeaderSection } from './Header';
import { StackLink, HorizontalButton } from './HeaderButton';
import HeaderTitle from './HeaderTitle';
import NoDocuments from './NoDocuments';
import DocumentPreview from './DocumentPreview';
import { addDocument } from '../actions';
import * as documentList from '../../styles/document-list.css';
import * as base from '../../styles/base.css';

export default connect(identity)(class DocumentList extends React.Component {
  constructor() {
    super();
    this.addDocument = () => this.props.dispatch(addDocument());
  }

  render() {
    const { documents, documentTitles, documentSections, sectionTextInputs } = this.props;

    let pagePreviews = map(id => (
      <DocumentPreview
        key={id}
        id={id}
        title={documentTitles[id]}
        sections={documentSections[id]}
        sectionTextInputs={sectionTextInputs}
      />
    ), documents);

    if (pagePreviews.length === 0) {
      pagePreviews = <NoDocuments onAddDocument={this.addDocument} />;
    }

    return (
      <div>
        <Header>
          <HeaderSection place="left">
            <HorizontalButton icon="file" text="New Document" onClick={this.addDocument} />
          </HeaderSection>
          <HeaderSection place="center">
            <HeaderTitle>Recora</HeaderTitle>
          </HeaderSection>
          <HeaderSection place="right">
            <StackLink icon="help1" text="About" to="/" />
          </HeaderSection>
        </Header>
        <AnimateInOut animateOutClassName={documentList.containerLeaving}>
          <div className={documentList.container}>
            { pagePreviews }
          </div>
        </AnimateInOut>
      </div>
    );
  }
});
