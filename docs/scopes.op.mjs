// Filesystem locators for esto programs — render-prop components with capability injection.
// `<GitRepo>` resolves the git root and hands down `{ File, Folder, repoRoot }` already rooted there;
// `<Folder>` re-binds the same capabilities to a matched subdir (recursive); `<File>` yields one
// `{ file }` per matched file. Pure userland: closures + `sh` + render-props. (Lives in a shared
// module because esto resolves relative imports in the Tier-2 / JSX path.)
import { sh } from 'esto'

// esto's h() collects children into an array, so a render-prop child arrives as [fn] — unwrap it.
export const rp = (children) => (Array.isArray(children) ? children[0] : children)

const rel = (root, p) => p.replace(`${root}/`, '')

const scope = (root) => {
  const File = ({ glob, children }) => {
    const i = glob.lastIndexOf('/')
    const dir = i < 0 ? '.' : glob.slice(0, i)
    const pat = i < 0 ? glob : glob.slice(i + 1)
    return sh`find ${root}/${dir} -maxdepth 1 -name ${pat} -type f`
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((f) => rp(children)({ file: rel(root, f) }))
  }
  const Folder = ({ glob, children }) =>
    sh`find ${root} -maxdepth 1 -type d -name ${glob}`
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((d) => rp(children)(scope(d))) // re-bind capabilities to the matched dir
  return { File, Folder, repoRoot: root }
}

export const GitRepo = ({ children }) => rp(children)(scope(sh`git rev-parse --show-toplevel`.trim()))
