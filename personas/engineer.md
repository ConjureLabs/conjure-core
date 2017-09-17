## Engineer

He is a software engineer working at a seed or series A company, focused on day-to-day tasks; Building out new features, fixing bugs, and reviewing peer code.

### Products & Services

#### GitHub

He uses GitHub actively. New code is pushed to GitHub, peer code is pulled down from GitHub, and code is reviewed via visual diffs.

#### Asana

His team uses Asana to track tasks, set due dates, and monitor the project activity.

#### Sublime Text

He writes his code in Sublime Text, and prefers lightweight editors over IDEs. He does know how to use VI or other command-line editors.

#### Spotify

Most of his development is done while wearing headphones and listening to his favorite playlists on Spotify.

### Conjure Use

Before any code can land on the working branch of the project, one or more engineers must review the code. This involves reading through the code, via the visual diff tool on GitHub, looking for poor patterns or syntax errors.

The code must also pass CI. This includes running lint checks for missing semicolons, unused vars, or other potential issues. Then, the code must pass any written unit tests before being allowed to land.

Usually the final step, if working on a web, mobile, or native app, is to pull the author's code down to his own machine, spin it up locally, and then view the branch, checking for regressions (other features breaking due to unhandled changes), styling breakage, new features not covering edge cases, or stacktraces appearing in logs.

Code review is done by GitHub, and it works well. Lint and unit test coverage is done via CI, which has become common practice. But viewing the changes locally and spot checking the changes more closely is still a manual process, which involves pausing active work, stashing it, checking out a different branch, pulling that down, making sure any new dependencies are installed, and finally running the local branch and checking both visuals and logs.

Conjure is meant to fill this third step, which is currently missing.
