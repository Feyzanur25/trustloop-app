# Feedback Workflow

## Export Google Form Responses

1. Open the published Google Form.
2. Open `Responses`.
3. Link responses to a Google Sheet.
4. Export the sheet as `.xlsx`.
5. Store the snapshot as `feedback/feedback_template.xlsx`.

## Improvement Process

1. Classify each response as bug, feature, UX, security, or documentation.
2. Convert high-priority items into tracked work.
3. Link implemented changes in roadmap, changelog, or issue tracking notes.

## Git Commit Links

Public commit links cannot be listed truthfully until the upgraded branch is pushed. After pushing:

1. run `git log --oneline`
2. copy the relevant hashes
3. build GitHub commit links from the real repository URL and those hashes

## Evidence Notes

The repository includes the spreadsheet artifact template. Real response exports must come from the actual published form.
