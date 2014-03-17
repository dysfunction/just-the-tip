# Just The Tip

Download and sync just the HEAD of a Git repository without downloading
the entire repository history.

## Server Setup

1. Edit the server section of `config.js`:

        server: {
          port: 1234,
          repos: {
            'repo-name': 'path/to/repo.git'
          }
        }

2. Run with `node server` or [pm2](https://github.com/Unitech/pm2)
(default port is 1234)

The `repo-name` will become part of the fetch URL the client will use.


## Client setup

1. Edit the client section of `config.js`:

        client: {
          folders: {
            'repo-folder': 'http://localhost:1234/repo-name/'
          }
        }

2. Run `node client`

## Explanation

The server basically exposes `git ls-tree HEAD` over HTTP.
The output from that command includes the SHA1 information for the files.

The client saves that listing in a `sync-tree.json` file in the local folder.
Any files on the client with a different hash are re-downloaded from the server.

The server delivers files by exposing `git show` over HTTP, meaning you can
actually reference a bare repo on the server.
