export const PAGE_TRANSITION_LOADING_EVENT =
  "rico:page-transition-loading-change";

declare global {
  interface Window {
    __RICO_PAGE_TRANSITION_LOADING__?: boolean;
  }
}

export const isPageTransitionLoading = () =>
  window.__RICO_PAGE_TRANSITION_LOADING__ === true;

export const setPageTransitionLoading = (loading: boolean) => {
  window.__RICO_PAGE_TRANSITION_LOADING__ = loading;
  window.dispatchEvent(
    new CustomEvent(PAGE_TRANSITION_LOADING_EVENT, {
      detail: { loading },
    }),
  );
};
