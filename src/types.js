// @flow

export type DocumentId = string;
export type SectionId = string;
export type RecoraResult = { text: string, pretty: string };
export type State = {
  documents: DocumentId[],
  documentTitles: { [key:DocumentId]: string },
  documentSections: { [key:DocumentId]: SectionId[] },
  sectionTitles: { [key:SectionId]: string },
  sectionTextInputs: { [key:SectionId]: string[] },
  sectionResults: { [key:SectionId]: RecoraResult[] },
  sectionTotals: { [key:SectionId]: RecoraResult },
};
