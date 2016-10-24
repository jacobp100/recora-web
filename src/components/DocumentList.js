// @flow
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { map, cond, matchesProperty, stubTrue, always, get, equals } from 'lodash/fp';
import { AnimateInOut } from 'state-transitions';
import { Header, HeaderSection } from './Header';
import { StackLink, StackButton, HorizontalButton } from './HeaderButton';
import HeaderTitle from './HeaderTitle';
import NoDocuments from './NoDocuments';
import DocumentPreview from './DocumentPreview';
import Popover from './Popover';
import AddAccountPopup from './AddAccountPopup';
import AccountsPopover from './AccountsPopover';
import { addDocument } from '../redux';
import { container, containerLeaving } from '../../styles/document-list.css';


const ACCOUNTS_POPOVER = 'accounts';
const ADD_ACCOUNT_POPUP = 'add-account';

class DocumentList extends Component {
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

  toggleAddAccountPopup = () => this.setState({ popup: ADD_ACCOUNT_POPUP, popover: null })
  closePopup = () => this.setState({ popup: null })

  toggleAccountsPopover = (e: Object) => this.setPopover(ACCOUNTS_POPOVER, e)
  closePopover = () => this.setState({ popover: null })

  renderPopup = cond([
    [equals(ADD_ACCOUNT_POPUP), () => (
      <AddAccountPopup onClose={this.closePopup} />
    )],
    [stubTrue, always(null)],
  ]);

  renderPopover = cond([
    [matchesProperty('type', ACCOUNTS_POPOVER), popover => (
      <AccountsPopover
        {...popover}
        onAddAccount={this.toggleAddAccountPopup}
        onClose={this.closePopover}
      />
    )],
    [stubTrue, always(null)],
  ]);

  render() {
    const { documents, addDocument } = this.props;
    const { popup, popover } = this.state;

    let pagePreviews = map(documentId => (
      <DocumentPreview
        key={documentId}
        documentId={documentId}
      />
    ), documents);

    if (pagePreviews.length === 0) {
      pagePreviews = <NoDocuments onAddDocument={addDocument} />;
    }

    return (
      <div>
        <Header>
          <HeaderSection place="left">
            <HorizontalButton iconName="file" text="New Document" onClick={addDocument} />
          </HeaderSection>
          <HeaderSection place="center">
            <HeaderTitle>Recora</HeaderTitle>
          </HeaderSection>
          <HeaderSection place="right">
            <StackButton iconName="help1" text="Accounts" onClick={this.toggleAccountsPopover} />
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
  { addDocument }
)(DocumentList);
