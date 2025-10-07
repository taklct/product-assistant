# Maintenance Tasks

## Fix Typo
- **Issue:** The search placeholder in the filters section uses the singular word "synonym" even though it invites searching by multiple synonyms, which reads like a typo in context.
- **Proposed Task:** Update the placeholder copy at line 196 in `terminology` to read "Search term, definition, synonyms..." so the grammar matches the intended plural meaning.

## Fix Bug
- **Issue:** The HTML document begins directly with the `<html>` tag and omits the required `<!DOCTYPE html>` declaration, forcing browsers into quirks mode and risking inconsistent rendering.
- **Proposed Task:** Add the `<!DOCTYPE html>` declaration above the opening `<html>` tag in `terminology` to ensure standards-mode rendering.

## Align Comment with Implementation
- **Issue:** The comment `<!-- New Chat Button -->` (line 74 in `terminology`) only mentions the button, but the block now contains both the button and an embedded search field, so the comment no longer describes the section accurately.
- **Proposed Task:** Update the comment to something like `<!-- New Chat & Search Section -->` so the documentation matches the current markup.

## Improve Test Coverage
- **Issue:** There is no automated regression guard for the terminology table rows rendered with the `.term-row` class (lines 219-296 in `terminology`), so structural regressions in the table would go unnoticed.
- **Proposed Task:** Introduce a frontend test (for example with Playwright or Jest + Testing Library) that loads the terminology page and asserts that the table renders the expected number of `.term-row` entries and that key columns (term, definition, synonyms, last change) are present.
