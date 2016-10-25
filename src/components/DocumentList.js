// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map, cond, matchesProperty, stubTrue, constant, get, equals, isEmpty } from 'lodash/fp';
import { AnimateInOut } from 'state-transitions';
import { Header, HeaderSection } from './Header';
import { StackLink, StackButton, HorizontalButton } from './HeaderButton';
import HeaderTitle from './HeaderTitle';
import NoDocuments from './NoDocuments';
import DocumentPreview from './DocumentPreview';
import Popover from './Popover';
import AddAccountPopup from './AddAccountPopup';
import AccountsPopover from './AccountsPopover';
import CreateDocumentPopover from './CreateDocumentPopover';
import { addDocument, loadDocuments } from '../redux';
import { container, containerLeaving } from '../../styles/document-list.css';


const LOADING_DOCUMENT_LIST_IN_FOREGROUND = 0;
const UPDATING_DOCUMENT_LIST_IN_BACKGROUND = 1;
const LOADED_DOCUMENT_LIST = 2;


const ACCOUNTS_POPOVER = 'accounts';
const CREATE_DOCUMENT_POPOVER = 'create-document';
const ADD_ACCOUNT_POPUP = 'add-account';

class DocumentList extends Component {
  constructor() {
    super();
    this.state = {
      documentLoadingState: LOADED_DOCUMENT_LIST,
      popup: null,
      popover: null,
    };
  }

  componentWillMount() {
    if (isEmpty(this.props.documents)) {
      this.setState({ documentLoadingState: LOADING_DOCUMENT_LIST_IN_FOREGROUND });
      this.doRefreshDocuments();
    }
  }

  setPopover = (type: string, e: Object) => {
    const popover = get(['popover', 'type'], this.state) !== type
      ? Popover.getPopover(type, e)
      : null;
    this.setState({ popover });
  }

  toggleAddAccountPopup = () => this.setState({ popup: ADD_ACCOUNT_POPUP, popover: null })
  closePopup = () => this.setState({ popup: null })

  toggleAccountsPopover = (e: Object) => this.setPopover(ACCOUNTS_POPOVER, e)
  toggleCreateDocumentPopover = (e: Object) => this.setPopover(CREATE_DOCUMENT_POPOVER, e)
  closePopover = () => this.setState({ popover: null })

  refreshDocuments = () => {
    this.setState({ documentLoadingState: UPDATING_DOCUMENT_LIST_IN_BACKGROUND });
    this.doRefreshDocuments();
  }

  doRefreshDocuments = () => {
    this.props.loadDocuments().then(() => {
      this.setState({ documentLoadingState: LOADED_DOCUMENT_LIST });
    });
  }

  renderPopup = cond([
    [equals(ADD_ACCOUNT_POPUP), () => (
      <AddAccountPopup onClose={this.closePopup} />
    )],
    [stubTrue, constant(null)],
  ]);

  renderPopover = cond([
    [matchesProperty('type', ACCOUNTS_POPOVER), popover => (
      <AccountsPopover
        {...popover}
        onAddAccount={this.toggleAddAccountPopup}
        onClose={this.closePopover}
      />
    )],
    [matchesProperty('type', CREATE_DOCUMENT_POPOVER), popover => (
      <CreateDocumentPopover
        {...popover}
        onClose={this.closePopover}
      />
    )],
    [stubTrue, constant(null)],
  ]);

  render() {
    const { documents, addDocument } = this.props;
    const { documentLoadingState, popup, popover } = this.state;

    let pagePreviews;
    if (documentLoadingState === LOADING_DOCUMENT_LIST_IN_FOREGROUND) {
      // Uses style from loading screen
      pagePreviews = <h1 className="loading">Loading Documents&hellip;</h1>;
    } else if (documents.length === 0) {
      pagePreviews = <NoDocuments onAddDocument={addDocument} />;
    } else {
      pagePreviews = map(documentId => (
        <DocumentPreview
          key={documentId}
          documentId={documentId}
        />
      ), documents);
    }

    const updatingInBackground = documentLoadingState === UPDATING_DOCUMENT_LIST_IN_BACKGROUND;

    return (
      <div>
        <Header>
          <HeaderSection place="left">
            <HorizontalButton iconName="file" text="New Document" onClick={addDocument} />
            <HorizontalButton iconName="angle-down" onClick={this.toggleCreateDocumentPopover} />
          </HeaderSection>
          <HeaderSection place="center">
            <HeaderTitle>{updatingInBackground ? 'Updating Documents…' : 'Recora'}</HeaderTitle>
          </HeaderSection>
          <HeaderSection place="right">
            <StackButton iconName="folder" text="Folders" onClick={this.toggleAccountsPopover} />
            <StackButton iconName="users" text="Accounts" onClick={this.toggleAccountsPopover} />
            <StackButton iconName="refresh-2" text="Refresh" onClick={this.refreshDocuments} />
            <StackLink iconName="help1" text="About" to="/" />
          </HeaderSection>
        </Header>
        <AnimateInOut animateOutClassName={containerLeaving}>
          <div className={container}>
            {pagePreviews}
          </div>
        </AnimateInOut>
        {this.renderPopup(popup)}
        {this.renderPopover(popover)}
      </div>
    );
  }
}

export default connect(
  ({ documents }) => ({
    documents,
  }),
  { loadDocuments, addDocument }
)(DocumentList);
