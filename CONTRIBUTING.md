# Contributing Guidelines

We follow [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow) as a workflow for introducing changes to the code.

## Create a GitHub Issue

We use GitHub Issues to document the changes we make to the code and to communicate/collaborate with other developers.

- Create a GitHub Issue to document what change you will make to the code and why.
  - Don't use generic titles such as "Fix Bug." Instead, use descriptive ones such as "Fix Bug: text in popover does not render line breaks."
- There are generally three types of changes: **Bug Fixes** (something isn't working), **Features** (adding new functionality), and **Tasks** (general improvements, refactoring, documentation updates, etc.).
- If fixing a bug, label the issue with the label `bug`. In the description of the issue:
  - Explain the expected (correct) behavior and the actual (erroneous) behavior. (Include any screenshots, error logs, etc.)
  - Enumerate the steps to reproduce the bug - be as specific as possible.
  - Include other specifications that provide more context about the issue, such as what device/operating system/browser you were using when the issues occurred.
- If adding a feature, label the issue with the label `feature`. In the description of the issue:
  - Explain what you are implementing and why.
  - Include a list of tasks required to complete the feature, and create separate GitHub issues for each task when applicable.
  - Link the related feature issue in each of these task issues to maintain traceability.
- If working on a general task, label the issue with the label `task`. This can include refactoring, documentation updates, and other technical improvements.

## Create a Git Branch

The `master` branch is the "production" branch. You should limit direct pushes to this branch. Instead, create a new branch off the `master` branch and make your changes there.

- Create a new branch off the `master` branch.
- Your branch name must be in the form `<author>_<branch-type>_<branch-name>`:
  - `author` is your name (don't include spaces).
  - `branch-type` is either a `bug`, `feature`, or `task`.
  - `branch-name` is a name describing what the branch is for.

## Make Changes

This stage includes designing, implementing, testing, updating documentation, etc.

- Write your code in the new branch.
- As you make changes, [commit early and often](https://youtu.be/Rep7vsUTaVI)!
- Make sure to frequently push your code to the project’s GitHub repository (this way, the team can track your progress).
- If you have questions about other existing code or need help from other developers, leave a comment under the GitHub issue and mention other developers. (Don’t use Slack for this!)

## Make a GitHub Pull Request

- Once you have finished work on your branch and pushed the changes, you should create a pull request from your branch into the `master` branch.
- Before making the pull request, check and see if the `master` branch is "ahead" of your branch. If that is the case, it means the branch has changed since you created your local branch of it.
- If the `master` branch is ahead of your working branch, you should make a pull request from that branch to your working branch! No need to assign a reviewer at this stage. Just resolve any conflicts and complete the merge.
- Once you have completed the merge (or if the `master` branch was not ahead of your working branch), then make a pull request to merge your current working branch into the `master` branch.
- Make sure to provide a description of the changes you made and why. Optionally, include screenshots or a [Loom video](https://www.loom.com/) showing the app where the bug is fixed, or the new feature is presented.
- Link the pull request to the issue you are resolving. This will automatically close the issue when the pull request is merged. It also provides a record of the resolution.
- Please do not approve your pull request immediately. Instead, post in Slack to have your code reviewed.
- Once at least one and ideally two people review it, address any feedback.
- Continue this process until your code is approved!
- Merge your branch!