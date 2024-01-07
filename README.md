# Tab Suspender

This fork adds support for suspending background tabs by tabs count, instead of timer.

Firefox addon link: https://addons.mozilla.org/ru/firefox/addon/tab-suspender-extension/

Tab Suspender is a lightweight Firefox extension that helps reduce memory usage by suspending inactive tabs. It uses the native discard API in Firefox to free up system resources used by background tabs.

Key features:

- Automatically suspends tabs that have been inactive for a configurable time period or tabs count exceeds configured max tabs count
- Suspended tabs are loaded on demand when switched back to
- Low overhead, only checks for inactive tabs periodically
- Open source extension available on GitHub

By suspending background tabs, Tab Suspender can significantly reduce Firefox's memory footprint and improve performance, especially for users who keep many tabs open. The extension aims to strike a balance between saving system resources and keeping tabs ready to resume.
