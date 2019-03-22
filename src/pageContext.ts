/**
 * Gathers information about a browser page: URL, title, and potentially other
 * properties such as user-agent, screen resolution, etc.
 */
export class PageContext {
  /**
   * URL for the current browser page.
   */
  public url: string;

  /**
   * Title for the current browser page.
   */
  public pageTitle: string;

  constructor() {
    this.url = window.location.href;
    this.pageTitle = document.title;
  }
}
